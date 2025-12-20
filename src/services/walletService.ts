// ============================================
// ESCARDIA - WALLET SERVICE
// File: src/services/walletService.ts
// ============================================

import { db } from '../config/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
  limit,
  increment,
} from 'firebase/firestore';

// ============================================
// TYPES
// ============================================

export interface Wallet {
  userId: string;
  balance: number;
  currency: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  createdAt: any;
  updatedAt: any;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  category: 'wallet_funding' | 'booking_payment' | 'refund' | 'bonus' | 'withdrawal';
  reference: string;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod?: 'card' | 'wallet' | 'bank_transfer';
  bookingId?: string;
  createdAt: any;
}
/*Get or create wallet for a user*/
export const getOrCreateWallet = async (userId: string, userName?: string): Promise<Wallet | null> => {
  try {
    const walletRef = doc(db, 'wallets', userId);
    const walletDoc = await getDoc(walletRef);

    if (walletDoc.exists()) {
      const data = walletDoc.data();
      return { 
        ...data, 
        userId,
        // Ensure account number is never empty
        accountNumber: data.accountNumber || generateVirtualAccountNumber(),
      } as Wallet;
    }

    // Create new wallet if doesn't exist
    const accountNumber = generateVirtualAccountNumber();
    const newWallet: Omit<Wallet, 'userId'> = {
      balance: 0,
      currency: 'NGN',
      bankName: 'Wema Bank', // Virtual account bank - will be dynamic with payment provider
      accountNumber: accountNumber,
      accountName: userName ? `Escardia - ${userName}` : 'Escardia Wallet',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(walletRef, newWallet);
    
    // Return with the actual account number (not serverTimestamp placeholders)
    return { 
      ...newWallet, 
      userId,
      accountNumber,
    } as Wallet;
  } catch (error) {
    console.error('Error getting/creating wallet:', error);
    return null;
  }
};

/*Get wallet balance*/
export const getWalletBalance = async (userId: string): Promise<number> => {
  try {
    const wallet = await getOrCreateWallet(userId);
    return wallet?.balance || 0;
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    return 0;
  }
};

/*Update wallet balance (internal use)*/
export const updateWalletBalance = async (
  userId: string,
  amount: number,
  type: 'credit' | 'debit'
): Promise<boolean> => {
  try {
    const walletRef = doc(db, 'wallets', userId);
    
    if (type === 'credit') {
      await updateDoc(walletRef, {
        balance: increment(amount),
        updatedAt: serverTimestamp(),
      });
    } else {
      // For debit, first check if sufficient balance
      const wallet = await getOrCreateWallet(userId);
      if (!wallet || wallet.balance < amount) {
        console.error('Insufficient wallet balance');
        return false;
      }
      
      await updateDoc(walletRef, {
        balance: increment(-amount),
        updatedAt: serverTimestamp(),
      });
    }

    return true;
  } catch (error) {
    console.error('Error updating wallet balance:', error);
    return false;
  }
};

// ============================================
// TRANSACTION FUNCTIONS
// ============================================

/**
 * Get user transactions
 */
export const getUserTransactions = async (
  userId: string,
  limitCount: number = 20
): Promise<Transaction[]> => {
  try {
    // First try with ordering (requires index)
    try {
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(transactionsQuery);
      
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Transaction[];
    } catch (indexError: any) {
      // If index not ready, try without ordering
      if (indexError.message?.includes('index')) {
        console.log('Index not ready, fetching without order...');
        const simpleQuery = query(
          collection(db, 'transactions'),
          where('userId', '==', userId),
          limit(limitCount)
        );
        
        const snapshot = await getDocs(simpleQuery);
        
        // Sort manually
        const transactions = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Transaction[];
        
        return transactions.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
      }
      throw indexError;
    }
  } catch (error) {
    console.error('Error getting transactions:', error);
    return [];
  }
};

/**
 * Get recent transactions (for wallet screen)
 */
export const getRecentTransactions = async (
  userId: string,
  limitCount: number = 5
): Promise<Transaction[]> => {
  return getUserTransactions(userId, limitCount);
};

/**
 * Create a new transaction
 */
export const createTransaction = async (
  transactionData: Omit<Transaction, 'id' | 'createdAt'>
): Promise<string | null> => {
  try {
    const docRef = await addDoc(collection(db, 'transactions'), {
      ...transactionData,
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating transaction:', error);
    return null;
  }
};

/**
 * Credit wallet (add money)
 */
export const creditWallet = async (
  userId: string,
  amount: number,
  description: string,
  category: Transaction['category'] = 'wallet_funding',
  paymentMethod: Transaction['paymentMethod'] = 'card',
  reference?: string
): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
  try {
    // Update wallet balance
    const balanceUpdated = await updateWalletBalance(userId, amount, 'credit');
    
    if (!balanceUpdated) {
      return { success: false, error: 'Failed to update wallet balance' };
    }

    // Create transaction record
    const transactionId = await createTransaction({
      userId,
      type: 'credit',
      amount,
      description,
      category,
      reference: reference || generateTransactionReference(),
      status: 'completed',
      paymentMethod,
    });

    return { success: true, transactionId: transactionId || undefined };
  } catch (error) {
    console.error('Error crediting wallet:', error);
    return { success: false, error: 'Failed to credit wallet' };
  }
};

/**
 * Debit wallet (pay from wallet)
 */
export const debitWallet = async (
  userId: string,
  amount: number,
  description: string,
  category: Transaction['category'] = 'booking_payment',
  bookingId?: string,
  reference?: string
): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
  try {
    // Check balance first
    const wallet = await getOrCreateWallet(userId);
    if (!wallet || wallet.balance < amount) {
      return { success: false, error: 'Insufficient wallet balance' };
    }

    // Update wallet balance
    const balanceUpdated = await updateWalletBalance(userId, amount, 'debit');
    
    if (!balanceUpdated) {
      return { success: false, error: 'Failed to update wallet balance' };
    }

    // Create transaction record
    const transactionId = await createTransaction({
      userId,
      type: 'debit',
      amount,
      description,
      category,
      reference: reference || generateTransactionReference(),
      status: 'completed',
      paymentMethod: 'wallet',
      bookingId,
    });

    return { success: true, transactionId: transactionId || undefined };
  } catch (error) {
    console.error('Error debiting wallet:', error);
    return { success: false, error: 'Failed to debit wallet' };
  }
};

/**
 * Process refund to wallet
 */
export const processRefund = async (
  userId: string,
  amount: number,
  bookingId: string,
  reason: string
): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
  return creditWallet(
    userId,
    amount,
    `Refund: ${reason}`,
    'refund',
    'wallet',
    `REF-${bookingId}-${Date.now()}`
  );
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate a unique transaction reference
 */
const generateTransactionReference = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `ESC-${timestamp}-${randomStr}`.toUpperCase();
};

/**
 * Generate a placeholder virtual account number
 * In production, this would come from your payment provider (Paystack, Flutterwave)
 */
const generateVirtualAccountNumber = (): string => {
  // This is a placeholder - real account numbers come from payment providers
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

/**
 * Format amount for display
 */
export const formatAmount = (amount: number): string => {
  return amount.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Format transaction date
 */
export const formatTransactionDate = (timestamp: any): string => {
  if (!timestamp) return '';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format full date for transaction details
 */
export const formatFullDate = (timestamp: any): string => {
  if (!timestamp) return '';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  
  return date.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Get transaction title based on category
 */
export const getTransactionTitle = (transaction: Transaction): string => {
  switch (transaction.category) {
    case 'wallet_funding':
      return 'Wallet Funded';
    case 'booking_payment':
      return `Payment for Trip`;
    case 'refund':
      return 'Refund Received';
    case 'bonus':
      return 'Bonus Credit';
    case 'withdrawal':
      return 'Withdrawal';
    default:
      return transaction.description;
  }
};

/**
 * Get transaction subtitle
 */
export const getTransactionSubtitle = (transaction: Transaction): string => {
  if (transaction.paymentMethod === 'card') {
    return 'Payment with card';
  } else if (transaction.paymentMethod === 'wallet') {
    return 'Payment with Wallet';
  } else if (transaction.paymentMethod === 'bank_transfer') {
    return 'Bank Transfer';
  }
  return transaction.description;
};
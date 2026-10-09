// ============================================
// ESCARDIA - Wallet (Supabase)
// The app can only READ balances. Money moves only on the server
// (payments, refunds, payouts), so nobody can edit their own balance.
// ============================================
import { supabase } from '../config/supabase';

export interface Wallet {
  userId: string;
  balance: number;        // available, can be spent or withdrawn
  pending: number;        // vendor earnings on hold until trips complete
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
  category: 'wallet_funding' | 'booking_payment' | 'refund' | 'bonus' | 'withdrawal' | 'earning' | 'earning_on_hold';
  reference: string;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod?: 'card' | 'wallet' | 'bank_transfer';
  bookingId?: string;
  createdAt: any;
}

const KIND_TO_CATEGORY: Record<string, Transaction['category']> = {
  wallet_funding: 'wallet_funding',
  booking_payment: 'booking_payment',
  refund: 'refund',
  withdrawal: 'withdrawal',
  withdrawal_reversed: 'refund',
  booking_earning_released: 'earning',
  cancellation_fee: 'earning',
  booking_earning_held: 'earning_on_hold',
};

const mapEntry = (r: any): Transaction => {
  const amount = Number(r.amount);
  return {
    id: String(r.id),
    userId: r.user_id,
    type: amount >= 0 ? 'credit' : 'debit',
    amount: Math.abs(amount),
    description: r.description ?? '',
    category: KIND_TO_CATEGORY[r.kind] ?? 'bonus',
    reference: r.payment_reference ?? '',
    status: r.bucket === 'pending' ? 'pending' : 'completed',
    paymentMethod: r.kind === 'booking_payment' ? 'wallet' : undefined,
    bookingId: r.booking_id ?? undefined,
    createdAt: r.created_at,
  };
};

/** The wallet is created automatically at sign up. */
export const getOrCreateWallet = async (userId: string, _userName?: string): Promise<Wallet | null> => {
  const { data } = await supabase.from('wallets').select('*').eq('user_id', userId).maybeSingle();
  if (!data) return null;
  return {
    userId,
    balance: Number(data.available),
    pending: Number(data.pending),
    currency: 'NGN',
    bankName: '',
    accountNumber: '',
    accountName: '',
    createdAt: data.updated_at,
    updatedAt: data.updated_at,
  };
};

export const getWalletBalance = async (userId: string): Promise<number> => {
  const w = await getOrCreateWallet(userId);
  return w?.balance ?? 0;
};

/** Vendor: available + on hold. */
export const getWalletBalances = async (userId: string) => {
  const w = await getOrCreateWallet(userId);
  return { available: w?.balance ?? 0, pending: w?.pending ?? 0 };
};

/**
 * Transaction history.
 * Customers see their wallet activity; vendors also see earnings put on hold.
 */
export const getUserTransactions = async (userId: string, limitCount: number = 20): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('ledger_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limitCount * 2);
  if (error) return [];
  // Releasing held money creates a matching pair (-pending, +available). Show only the +available line.
  return (data ?? [])
    .filter((r) => !(r.bucket === 'pending' && Number(r.amount) < 0))
    .slice(0, limitCount)
    .map(mapEntry);
};

export const getRecentTransactions = async (userId: string, limitCount: number = 5) => getUserTransactions(userId, limitCount);

// ---- Kept so old imports still compile. Money can no longer be moved from the app. ----
const serverOnly = async (..._args: unknown[]) => ({
  success: false,
  error: 'Wallet balances are updated automatically by Escardia.',
});
export const updateWalletBalance = serverOnly;
export const createTransaction = async (..._args: unknown[]): Promise<string | null> => null;
export const creditWallet = serverOnly;
export const debitWallet = serverOnly;
export const processRefund = serverOnly;

// ---------------- Formatting ----------------

export const formatAmount = (amount: number): string =>
  Number(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const toDate = (timestamp: any) => (timestamp?.toDate ? timestamp.toDate() : new Date(timestamp));

export const formatTransactionDate = (timestamp: any): string => {
  if (!timestamp) return '';
  return toDate(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

export const formatFullDate = (timestamp: any): string => {
  if (!timestamp) return '';
  return toDate(timestamp).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const getTransactionTitle = (transaction: Transaction): string => {
  switch (transaction.category) {
    case 'wallet_funding': return 'Wallet Funded';
    case 'booking_payment': return 'Payment for Trip';
    case 'refund': return 'Refund Received';
    case 'bonus': return 'Bonus Credit';
    case 'withdrawal': return 'Withdrawal';
    case 'earning': return 'Trip Earnings';
    case 'earning_on_hold': return 'Earnings on Hold';
    default: return transaction.description;
  }
};

export const getTransactionSubtitle = (transaction: Transaction): string => {
  if (transaction.paymentMethod === 'card') return 'Payment with card';
  if (transaction.paymentMethod === 'wallet') return 'Payment with Wallet';
  if (transaction.paymentMethod === 'bank_transfer') return 'Bank Transfer';
  return transaction.description;
};

import { db, auth } from '../config/firebase';
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
export const PAYSTACK_CONFIG = {
  // Use test keys for development, live keys for production
  PUBLIC_KEY: 'pk_test_aa491bd52d96bbe67517ea60a97d33bd544af53c', // Replace with your public key
  SECRET_KEY: 'sk_test_7eee5afe255b8715ee6d460e76703da4a0bf4aa7', // Replace with your secret key (only for backend)
  
  // Callback URLs
  CALLBACK_URL: 'https://your-domain.com/api/paystack/callback', // Your webhook URL
  
  // Commission rate (13%)
  ESCARDIA_COMMISSION: 0.13,
};
export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    status: 'success' | 'failed' | 'abandoned';
    reference: string;
    amount: number; // In kobo
    currency: string;
    channel: string;
    customer: {
      email: string;
      customer_code: string;
    };
    paid_at: string;
    metadata: any;
  };
}

export interface PaymentMetadata {
  userId: string;
  paymentType: 'booking' | 'wallet_funding';
  bookingId?: string;
  vendorId?: string;
  carId?: string;
  carName?: string;
  duration?: string;
  escardiaCommission?: number;
  vendorAmount?: number;
}

/* Generate unique payment reference*/
export const generateReference = (prefix: string = 'ESC'): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${randomStr}`.toUpperCase();
};

/*Convert Naira to Kobo (Paystack uses kobo)*/
export const nairaToKobo = (naira: number): number => {
  return Math.round(naira * 100);
};

/*Convert Kobo to Naira*/
export const koboToNaira = (kobo: number): number => {
  return kobo / 100;
};

/*Calculate payment split*/
export const calculatePaymentSplit = (totalAmount: number) => {
  const escardiaCommission = Math.round(totalAmount * PAYSTACK_CONFIG.ESCARDIA_COMMISSION);
  const vendorAmount = totalAmount - escardiaCommission;
  
  return {
    totalAmount,
    escardiaCommission,
    vendorAmount,
    commissionRate: PAYSTACK_CONFIG.ESCARDIA_COMMISSION * 100, // 10%
  };
};
/*Initialize payment for booking*/
export const initializeBookingPayment = async (
  email: string,
  amount: number, // In Naira
  bookingData: {
    bookingId: string;
    userId: string;
    vendorId: string;
    carId: string;
    carName: string;
    duration: string;
  }
): Promise<{ success: boolean; authorizationUrl?: string; reference?: string; error?: string }> => {
  try {
    const reference = generateReference('BKG');
    const split = calculatePaymentSplit(amount);
    
    const metadata: PaymentMetadata = {
      userId: bookingData.userId,
      paymentType: 'booking',
      bookingId: bookingData.bookingId,
      vendorId: bookingData.vendorId,
      carId: bookingData.carId,
      carName: bookingData.carName,
      duration: bookingData.duration,
      escardiaCommission: split.escardiaCommission,
      vendorAmount: split.vendorAmount,
    };

    // Initialize with Paystack
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_CONFIG.SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: nairaToKobo(amount),
        reference,
        callback_url: PAYSTACK_CONFIG.CALLBACK_URL,
        metadata,
        channels: ['card', 'bank', 'ussd', 'bank_transfer'],
      }),
    });

    const data: PaystackInitializeResponse = await response.json();

    if (data.status) {
      // Save pending transaction to Firestore
      await addDoc(collection(db, 'payments'), {
        reference: data.data.reference,
        accessCode: data.data.access_code,
        amount,
        amountKobo: nairaToKobo(amount),
        status: 'pending',
        paymentType: 'booking',
        metadata,
        createdAt: serverTimestamp(),
      });

      return {
        success: true,
        authorizationUrl: data.data.authorization_url,
        reference: data.data.reference,
      };
    } else {
      return { success: false, error: data.message };
    }
  } catch (error: any) {
    console.error('Error initializing booking payment:', error);
    return { success: false, error: error.message || 'Payment initialization failed' };
  }
};

/**
 * Initialize payment for wallet funding
 */
export const initializeWalletFunding = async (
  email: string,
  amount: number, // In Naira
  userId: string
): Promise<{ success: boolean; authorizationUrl?: string; reference?: string; error?: string }> => {
  try {
    const reference = generateReference('WLT');
    
    const metadata: PaymentMetadata = {
      userId,
      paymentType: 'wallet_funding',
    };

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_CONFIG.SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: nairaToKobo(amount),
        reference,
        callback_url: PAYSTACK_CONFIG.CALLBACK_URL,
        metadata,
        channels: ['card', 'bank', 'ussd', 'bank_transfer'],
      }),
    });

    const data: PaystackInitializeResponse = await response.json();

    if (data.status) {
      // Save pending transaction
      await addDoc(collection(db, 'payments'), {
        reference: data.data.reference,
        accessCode: data.data.access_code,
        amount,
        amountKobo: nairaToKobo(amount),
        status: 'pending',
        paymentType: 'wallet_funding',
        userId,
        metadata,
        createdAt: serverTimestamp(),
      });

      return {
        success: true,
        authorizationUrl: data.data.authorization_url,
        reference: data.data.reference,
      };
    } else {
      return { success: false, error: data.message };
    }
  } catch (error: any) {
    console.error('Error initializing wallet funding:', error);
    return { success: false, error: error.message || 'Payment initialization failed' };
  }
};

// ============================================
// PAYMENT VERIFICATION
// ============================================

/**
 * Verify payment status with Paystack
 */
export const verifyPayment = async (
  reference: string
): Promise<{ success: boolean; data?: PaystackVerifyResponse['data']; error?: string }> => {
  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_CONFIG.SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data: PaystackVerifyResponse = await response.json();

    if (data.status && data.data.status === 'success') {
      return { success: true, data: data.data };
    } else {
      return { 
        success: false, 
        error: data.data?.status === 'failed' ? 'Payment failed' : 'Payment not completed' 
      };
    }
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return { success: false, error: error.message || 'Verification failed' };
  }
};

// ============================================
// VENDOR TRANSFERS (Withdrawals)
// ============================================

/**
 * Create transfer recipient (vendor's bank account)
 */
export const createTransferRecipient = async (
  bankCode: string,
  accountNumber: string,
  accountName: string
): Promise<{ success: boolean; recipientCode?: string; error?: string }> => {
  try {
    const response = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_CONFIG.SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'nuban',
        name: accountName,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'NGN',
      }),
    });

    const data = await response.json();

    if (data.status) {
      return { success: true, recipientCode: data.data.recipient_code };
    } else {
      return { success: false, error: data.message };
    }
  } catch (error: any) {
    console.error('Error creating transfer recipient:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Initiate transfer to vendor
 */
export const initiateTransfer = async (
  amount: number, // In Naira
  recipientCode: string,
  reason: string,
  reference?: string
): Promise<{ success: boolean; transferCode?: string; error?: string }> => {
  try {
    const response = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_CONFIG.SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'balance',
        amount: nairaToKobo(amount),
        recipient: recipientCode,
        reason,
        reference: reference || generateReference('TRF'),
      }),
    });

    const data = await response.json();

    if (data.status) {
      return { success: true, transferCode: data.data.transfer_code };
    } else {
      return { success: false, error: data.message };
    }
  } catch (error: any) {
    console.error('Error initiating transfer:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// BANK LIST
// ============================================

/**
 * Get list of Nigerian banks
 */
export const getBankList = async (): Promise<{ success: boolean; banks?: any[]; error?: string }> => {
  try {
    const response = await fetch('https://api.paystack.co/bank?country=nigeria', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_CONFIG.SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.status) {
      return { success: true, banks: data.data };
    } else {
      return { success: false, error: data.message };
    }
  } catch (error: any) {
    console.error('Error fetching banks:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verify bank account
 */
export const verifyBankAccount = async (
  accountNumber: string,
  bankCode: string
): Promise<{ success: boolean; accountName?: string; error?: string }> => {
  try {
    const response = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_CONFIG.SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (data.status) {
      return { success: true, accountName: data.data.account_name };
    } else {
      return { success: false, error: data.message };
    }
  } catch (error: any) {
    console.error('Error verifying bank account:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// PAYSTACK BANK CODES (Common Nigerian Banks)
// ============================================

export const NIGERIAN_BANKS = [
  { name: 'Access Bank', code: '044' },
  { name: 'Citibank Nigeria', code: '023' },
  { name: 'Ecobank Nigeria', code: '050' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'First City Monument Bank', code: '214' },
  { name: 'Globus Bank', code: '103' },
  { name: 'Guaranty Trust Bank', code: '058' },
  { name: 'Heritage Bank', code: '030' },
  { name: 'Jaiz Bank', code: '301' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'Kuda Bank', code: '50211' },
  { name: 'OPay', code: '999992' },
  { name: 'Palmpay', code: '999991' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Standard Chartered Bank', code: '068' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Union Bank of Nigeria', code: '032' },
  { name: 'United Bank For Africa', code: '033' },
  { name: 'Unity Bank', code: '215' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Zenith Bank', code: '057' },
];
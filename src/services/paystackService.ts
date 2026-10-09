// ============================================
// ESCARDIA - Paystack (client side)
// The secret key now lives ONLY on the server (Supabase Edge Functions).
// The app asks the server to start, verify and pay out; it never talks to Paystack with a key.
// ============================================
import { supabase, SUPABASE_URL } from '../config/supabase';

export const PAYSTACK_CONFIG = {
  // Paystack sends the customer here after paying; the payment screen closes when it sees it.
  CALLBACK_URL: `${SUPABASE_URL}/functions/v1/paystack-callback`,
};

/** Calls an Edge Function and turns its error body into a readable message. */
const callFunction = async <T = any>(name: string, body: Record<string, unknown>): Promise<T> => {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let message = error.message;
    try {
      const ctx = (error as any).context;
      if (ctx?.json) message = (await ctx.json())?.error ?? message;
    } catch {
      // keep the default message
    }
    throw new Error(message || 'Something went wrong');
  }
  if (data?.error) throw new Error(data.error);
  return data as T;
};

export const generateReference = (prefix: string = 'ESC'): string =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase();

export const nairaToKobo = (naira: number): number => Math.round(naira * 100);
export const koboToNaira = (kobo: number): number => kobo / 100;

/** Display only. The real split is calculated by the database. */
export const calculatePaymentSplit = (totalAmount: number) => {
  const rate = 0.13;
  const escardiaCommission = Math.round(totalAmount * rate);
  return { totalAmount, escardiaCommission, vendorAmount: totalAmount - escardiaCommission, commissionRate: rate * 100 };
};

type InitResult = { success: boolean; authorizationUrl?: string; reference?: string; amount?: number; error?: string };

/** Starts a Paystack payment for a booking that is waiting for payment. The server sets the amount. */
export const initializeBookingPayment = async (
  _email: string,
  _amount: number,
  bookingData: { bookingId: string; [key: string]: unknown }
): Promise<InitResult> => {
  try {
    const r = await callFunction('paystack-initialize', { purpose: 'booking', bookingId: bookingData.bookingId });
    return { success: true, authorizationUrl: r.authorizationUrl, reference: r.reference, amount: r.amount };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

/** Starts a Paystack payment to top up the wallet. */
export const initializeWalletFunding = async (_email: string, amount: number, _userId?: string): Promise<InitResult> => {
  try {
    const r = await callFunction('paystack-initialize', { purpose: 'wallet_funding', amount });
    return { success: true, authorizationUrl: r.authorizationUrl, reference: r.reference, amount: r.amount };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

/**
 * Asks the server to confirm a payment with Paystack.
 * Bank transfers can take a little while, so this retries a few times.
 */
export const verifyPayment = async (
  reference: string,
  attempts = 4
): Promise<{ success: boolean; pending?: boolean; outcome?: string; error?: string }> => {
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await callFunction<{ status: string; outcome?: string; message?: string }>('paystack-verify', { reference });
      if (r.status === 'success') return { success: true, outcome: r.outcome };
      if (r.status === 'failed') return { success: false, error: r.message || 'Payment was not completed' };
    } catch (e: any) {
      if (i === attempts - 1) return { success: false, error: e.message };
    }
    await new Promise((res) => setTimeout(res, 3000));
  }
  return {
    success: false,
    pending: true,
    error: 'Your payment is still processing. It will be confirmed automatically once Paystack receives it.',
  };
};

// ---------------- Banks and payouts (vendors) ----------------

export const getBankList = async (): Promise<{ success: boolean; banks?: { name: string; code: string }[]; error?: string }> => {
  try {
    const r = await callFunction('vendor-bank', { action: 'banks' });
    return { success: true, banks: r.banks };
  } catch (e: any) {
    return { success: false, error: e.message, banks: NIGERIAN_BANKS };
  }
};

export const verifyBankAccount = async (
  accountNumber: string,
  bankCode: string
): Promise<{ success: boolean; accountName?: string; error?: string }> => {
  try {
    const r = await callFunction('vendor-bank', { action: 'resolve', accountNumber, bankCode });
    return { success: true, accountName: r.accountName };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

/** Verifies the account with the bank and saves it as the vendor's payout account. */
export const saveVendorBankAccount = async (
  accountNumber: string,
  bankCode: string,
  bankName?: string
): Promise<{ success: boolean; accountName?: string; bankName?: string; error?: string }> => {
  try {
    const r = await callFunction('vendor-bank', { action: 'save', accountNumber, bankCode, bankName });
    return { success: true, accountName: r.accountName, bankName: r.bankName };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

/** Kept for old imports: saving the account now creates the Paystack recipient on the server. */
export const createTransferRecipient = async (name: string, accountNumber: string, bankCode: string) => {
  const r = await saveVendorBankAccount(accountNumber, bankCode);
  return { success: r.success, recipientCode: r.success ? 'saved' : undefined, error: r.error, name };
};

/** Vendor asks for a payout. Escardia reviews it, then the server sends the transfer. */
export const requestWithdrawal = async (amount: number): Promise<{ success: boolean; withdrawalId?: string; reference?: string; error?: string }> => {
  const { data, error } = await supabase.rpc('request_withdrawal', { p_amount: amount });
  if (error) return { success: false, error: error.message };
  return { success: true, withdrawalId: data.id, reference: data.reference };
};

/** Old direct transfers are disabled: payouts go through requestWithdrawal. */
export const initiateTransfer = async (..._args: unknown[]) => ({
  success: false,
  error: 'Use requestWithdrawal; transfers are sent by Escardia after review.',
});

// ============================================
// PAYSTACK BANK CODES (fallback list if the live list fails to load)
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

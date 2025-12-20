// ============================================
// ESCARDIA - PAYSTACK WEBHOOK (Cloud Function)
// File: functions/src/paystack-webhook.ts
// ============================================
//
// This handles Paystack webhooks to:
// 1. Verify payments automatically
// 2. Credit wallets
// 3. Split payments (Escardia 10%, Vendor 90%)
// 4. Update booking status
//
// SETUP:
// 1. Add to your functions/src/index.ts
// 2. Deploy: firebase deploy --only functions
// 3. Add webhook URL to Paystack Dashboard:
//    https://your-project.cloudfunctions.net/paystackWebhook
//
// ============================================

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

// Initialize if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ============================================
// CONFIGURATION
// ============================================

// Get secret key from Firebase config
// Set with: firebase functions:config:set paystack.secret_key="sk_live_xxx"
const PAYSTACK_SECRET_KEY = functions.config().paystack?.secret_key || 'sk_test_xxx';
const ESCARDIA_COMMISSION_RATE = 0.10; // 10%

// ============================================
// TYPES
// ============================================

interface PaystackEvent {
  event: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number; // In kobo
    currency: string;
    channel: string;
    customer: {
      email: string;
      customer_code: string;
    };
    metadata: {
      userId?: string;
      paymentType?: 'booking' | 'wallet_funding';
      bookingId?: string;
      vendorId?: string;
      carId?: string;
      carName?: string;
      duration?: string;
      escardiaCommission?: number;
      vendorAmount?: number;
    };
    paid_at: string;
  };
}

// ============================================
// WEBHOOK HANDLER
// ============================================

export const paystackWebhook = functions.https.onRequest(async (req, res) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      console.error('Invalid Paystack signature');
      res.status(401).send('Invalid signature');
      return;
    }

    const event: PaystackEvent = req.body;
    console.log('📥 Paystack webhook received:', event.event);

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        await handleSuccessfulCharge(event.data);
        break;

      case 'transfer.success':
        await handleSuccessfulTransfer(event.data);
        break;

      case 'transfer.failed':
        await handleFailedTransfer(event.data);
        break;

      default:
        console.log('Unhandled event:', event.event);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// ============================================
// HANDLE SUCCESSFUL PAYMENT
// ============================================

async function handleSuccessfulCharge(data: PaystackEvent['data']) {
  const { reference, amount, metadata, status } = data;

  if (status !== 'success') {
    console.log('Payment not successful:', status);
    return;
  }

  const amountNaira = amount / 100; // Convert kobo to Naira
  console.log(`✅ Payment successful: ${reference} - ₦${amountNaira}`);

  // Update payment record
  const paymentQuery = await db
    .collection('payments')
    .where('reference', '==', reference)
    .limit(1)
    .get();

  if (!paymentQuery.empty) {
    const paymentDoc = paymentQuery.docs[0];
    await paymentDoc.ref.update({
      status: 'success',
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      paystackData: data,
    });
  }

  // Handle based on payment type
  if (metadata?.paymentType === 'wallet_funding') {
    await handleWalletFunding(metadata.userId!, amountNaira, reference);
  } else if (metadata?.paymentType === 'booking') {
    await handleBookingPayment(
      metadata.userId!,
      metadata.vendorId!,
      metadata.bookingId!,
      amountNaira,
      reference,
      metadata
    );
  }
}

// ============================================
// HANDLE WALLET FUNDING
// ============================================

async function handleWalletFunding(userId: string, amount: number, reference: string) {
  console.log(`💰 Funding wallet for user ${userId}: ₦${amount}`);

  try {
    // Get or create wallet
    const walletRef = db.collection('wallets').doc(userId);
    const walletDoc = await walletRef.get();

    if (walletDoc.exists) {
      // Update existing wallet
      await walletRef.update({
        balance: admin.firestore.FieldValue.increment(amount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // Create new wallet
      await walletRef.set({
        balance: amount,
        currency: 'NGN',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Create transaction record
    await db.collection('transactions').add({
      userId,
      type: 'credit',
      amount,
      description: 'Wallet funding via Paystack',
      category: 'wallet_funding',
      reference,
      status: 'completed',
      paymentMethod: 'card',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Wallet funded successfully: ${userId} +₦${amount}`);
  } catch (error) {
    console.error('Error funding wallet:', error);
    throw error;
  }
}

// ============================================
// HANDLE BOOKING PAYMENT
// ============================================

async function handleBookingPayment(
  userId: string,
  vendorId: string,
  bookingId: string,
  totalAmount: number,
  reference: string,
  metadata: any
) {
  console.log(`🚗 Processing booking payment: ${bookingId} - ₦${totalAmount}`);

  try {
    // Calculate split
    const escardiaCommission = Math.round(totalAmount * ESCARDIA_COMMISSION_RATE);
    const vendorAmount = totalAmount - escardiaCommission;

    console.log(`Split: Escardia ₦${escardiaCommission}, Vendor ₦${vendorAmount}`);

    // 1. Update booking status
    await db.collection('bookings').doc(bookingId).update({
      paymentStatus: 'paid',
      paymentReference: reference,
      paymentMethod: 'card',
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      escardiaCommission,
      vendorAmount,
    });

    // 2. Credit vendor wallet
    const vendorWalletRef = db.collection('wallets').doc(vendorId);
    const vendorWalletDoc = await vendorWalletRef.get();

    if (vendorWalletDoc.exists) {
      await vendorWalletRef.update({
        balance: admin.firestore.FieldValue.increment(vendorAmount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      await vendorWalletRef.set({
        balance: vendorAmount,
        currency: 'NGN',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // 3. Create vendor transaction record
    await db.collection('transactions').add({
      userId: vendorId,
      type: 'credit',
      amount: vendorAmount,
      description: `Booking payment: ${metadata.carName || 'Car rental'}`,
      category: 'booking_payment',
      reference: `${reference}-VENDOR`,
      status: 'completed',
      paymentMethod: 'card',
      bookingId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 4. Record Escardia commission
    await db.collection('commissions').add({
      bookingId,
      userId,
      vendorId,
      totalAmount,
      commissionAmount: escardiaCommission,
      commissionRate: ESCARDIA_COMMISSION_RATE,
      vendorAmount,
      reference,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 5. Send notifications (optional - integrate with your notification system)
    await sendPaymentNotifications(userId, vendorId, bookingId, totalAmount, vendorAmount);

    console.log(`✅ Booking payment processed: ${bookingId}`);
  } catch (error) {
    console.error('Error processing booking payment:', error);
    throw error;
  }
}

// ============================================
// SEND NOTIFICATIONS
// ============================================

async function sendPaymentNotifications(
  userId: string,
  vendorId: string,
  bookingId: string,
  totalAmount: number,
  vendorAmount: number
) {
  try {
    // Notification for user
    await db.collection('notifications').add({
      userId,
      title: '✅ Payment Successful!',
      body: `Your payment of ₦${totalAmount.toLocaleString()} has been confirmed.`,
      type: 'PAYMENT_SUCCESS',
      data: { bookingId },
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Notification for vendor
    await db.collection('notifications').add({
      userId: vendorId,
      title: '🎉 New Booking Payment!',
      body: `You received ₦${vendorAmount.toLocaleString()} for a new booking.`,
      type: 'BOOKING_PAYMENT',
      data: { bookingId },
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('📬 Payment notifications sent');
  } catch (error) {
    console.error('Error sending notifications:', error);
    // Don't throw - notifications are not critical
  }
}

// ============================================
// HANDLE SUCCESSFUL TRANSFER (Vendor Withdrawal)
// ============================================

async function handleSuccessfulTransfer(data: any) {
  const { reference, amount } = data;
  const amountNaira = amount / 100;

  console.log(`✅ Transfer successful: ${reference} - ₦${amountNaira}`);

  // Update withdrawal record
  const withdrawalQuery = await db
    .collection('withdrawals')
    .where('reference', '==', reference)
    .limit(1)
    .get();

  if (!withdrawalQuery.empty) {
    const withdrawalDoc = withdrawalQuery.docs[0];
    await withdrawalDoc.ref.update({
      status: 'success',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Notify vendor
    const withdrawal = withdrawalDoc.data();
    if (withdrawal.vendorId) {
      await db.collection('notifications').add({
        userId: withdrawal.vendorId,
        title: '💰 Withdrawal Successful!',
        body: `₦${amountNaira.toLocaleString()} has been sent to your bank account.`,
        type: 'WITHDRAWAL_SUCCESS',
        data: { reference },
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
}

// ============================================
// HANDLE FAILED TRANSFER
// ============================================

async function handleFailedTransfer(data: any) {
  const { reference, amount } = data;
  const amountNaira = amount / 100;

  console.log(`❌ Transfer failed: ${reference} - ₦${amountNaira}`);

  // Update withdrawal record
  const withdrawalQuery = await db
    .collection('withdrawals')
    .where('reference', '==', reference)
    .limit(1)
    .get();

  if (!withdrawalQuery.empty) {
    const withdrawalDoc = withdrawalQuery.docs[0];
    const withdrawal = withdrawalDoc.data();

    await withdrawalDoc.ref.update({
      status: 'failed',
      failedAt: admin.firestore.FieldValue.serverTimestamp(),
      failureReason: data.reason || 'Unknown',
    });

    // Refund to vendor wallet
    if (withdrawal.vendorId) {
      const walletRef = db.collection('wallets').doc(withdrawal.vendorId);
      await walletRef.update({
        balance: admin.firestore.FieldValue.increment(amountNaira),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Notify vendor
      await db.collection('notifications').add({
        userId: withdrawal.vendorId,
        title: '❌ Withdrawal Failed',
        body: `Your withdrawal of ₦${amountNaira.toLocaleString()} failed. Amount has been refunded to your wallet.`,
        type: 'WITHDRAWAL_FAILED',
        data: { reference },
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
}

// ============================================
// EXPORT FOR INDEX.TS
// ============================================

// Add this to your functions/src/index.ts:
// export { paystackWebhook } from './paystack-webhook';
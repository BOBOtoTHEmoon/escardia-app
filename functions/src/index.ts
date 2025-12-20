import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// ============================================
// EXPORT ALL CLOUD FUNCTIONS
// ============================================

// Paystack Webhook (Payment verification & splitting)
export { paystackWebhook } from './paystack-webhook';

// If you have notification functions from before, add them too:
// export { onNewUserSignup } from './notifications';
// export { onNewBooking } from './notifications';
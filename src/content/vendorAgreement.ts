// ============================================
// ESCARDIA - Vendor agreement and vendor privacy notice
// Numbers come from the live settings row, so the text always matches
// what the database actually does with a vendor's money.
// ============================================
import { AppSettings } from '../services/settingsService';

export type Section = { title: string; body: string };

const pct = (rate: number) => `${Math.round(rate * 1000) / 10}%`;
const money = (n: number) => `₦${Number(n).toLocaleString('en-NG')}`;

export const vendorAgreement = (s: AppSettings): Section[] => [
  {
    title: '1. Who can be a vendor',
    body:
      'You must be at least 18, give a valid government ID, and own the cars you list or have the legal right to rent them out. Escardia reviews every vendor before they can take bookings, and every car before customers can see it.',
  },
  {
    title: '2. Your cars',
    body:
      '• Photos and details must be accurate and current\n• Cars must be roadworthy, clean, registered and insured\n• Changing a car’s make, model, year or photos sends it back for review\n• Mark a car as in maintenance when it cannot be booked',
  },
  {
    title: '3. Drivers',
    body:
      'Drivers you assign to trips must hold a valid licence, be properly vetted, and arrive on time. Assign the driver to the booking in the app so the customer can see who is coming and call them.',
  },
  {
    title: '4. Pricing and commission',
    body: `You set your daily and hourly prices. Escardia keeps a ${pct(s.commissionRate)} commission on the car rental and any delivery fee. Customers also pay Escardia a service fee and any security escort fees on top; these do not come out of your share.`,
  },
  {
    title: '5. Getting paid',
    body: `Customers pay in full when they book, and Escardia holds the money. When a trip ends, your share is held for ${s.payoutHoldHours} hours so the customer can report a problem. After that it moves to your available balance and you can withdraw it to your bank. Each withdrawal has a ${money(s.withdrawalFee)} transfer fee and the minimum is ${money(s.minWithdrawal)}.`,
  },
  {
    title: '6. Cancellations',
    body:
      'If you cancel a confirmed booking, the customer gets a full refund and you are not paid for it. If the customer cancels, they are refunded based on how early they cancel, and you keep your share of whatever they are not refunded. Cancelling often may lead to your account being suspended.',
  },
  {
    title: '7. Problems during a trip',
    body:
      'If a customer reports a problem, your payout for that trip is paused while Escardia reviews it. Escardia may pay you all, part or none of your share depending on what happened, and we tell you the outcome.',
  },
  {
    title: '8. Suspension',
    body:
      'Escardia may pause or remove a car or a vendor account for false information, unsafe cars or drivers, repeated cancellations, or treating customers badly.',
  },
];

export const vendorPrivacy: Section[] = [
  {
    title: 'What we collect',
    body:
      'Your name, email and phone number, your business details, your ID and business documents, your bank details for payouts, your cars and drivers, and your booking and payment history.',
  },
  {
    title: 'How we use it',
    body:
      'To check who you are before you can list cars, to show your cars to customers, to run bookings, and to pay you. We do not sell your data.',
  },
  {
    title: 'What customers see',
    body:
      'Customers see your business name and phone number, your cars, and the name and phone number of the driver on their trip. They never see your ID, documents or bank details.',
  },
  {
    title: 'How we protect it',
    body:
      'Your ID and documents are stored privately and only Escardia staff can view them. Payouts are sent through Paystack. Your data is encrypted in transit and at rest.',
  },
  {
    title: 'Your choices',
    body: 'You can update your details in the app at any time. To close your account or ask for a copy of your data, contact support@escardia.com.',
  },
];

export const AGREEMENT_UPDATED = 'October 2026';

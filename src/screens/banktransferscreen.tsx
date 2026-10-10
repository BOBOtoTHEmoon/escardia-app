import React from 'react';
import { PaidBooking, PaystackCheckout } from '../components/PaystackCheckout';

interface BankTransferScreenProps {
  onNavigateBack: () => void;
  onPaymentComplete: (paymentMethod: string, result?: PaidBooking) => void;
  totalAmount: number;
  bookingData?: any;
}

const BankTransferScreen: React.FC<BankTransferScreenProps> = ({ onNavigateBack, onPaymentComplete, totalAmount, bookingData }) => (
  <PaystackCheckout
    method="bank"
    quotedAmount={totalAmount}
    bookingData={bookingData}
    onNavigateBack={onNavigateBack}
    onPaid={(result) => onPaymentComplete('bank', result)}
  />
);

export { BankTransferScreen };
export default BankTransferScreen;

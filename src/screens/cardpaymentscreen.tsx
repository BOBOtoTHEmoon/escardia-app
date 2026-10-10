import React from 'react';
import { PaidBooking, PaystackCheckout } from '../components/PaystackCheckout';

interface CardPaymentScreenProps {
  onNavigateBack: () => void;
  onPaymentComplete: (paymentMethod: string, result?: PaidBooking) => void;
  totalAmount: number;
  bookingData?: any;
}

const CardPaymentScreen: React.FC<CardPaymentScreenProps> = ({ onNavigateBack, onPaymentComplete, totalAmount, bookingData }) => (
  <PaystackCheckout
    method="card"
    quotedAmount={totalAmount}
    bookingData={bookingData}
    onNavigateBack={onNavigateBack}
    onPaid={(result) => onPaymentComplete('card', result)}
  />
);

export { CardPaymentScreen };
export default CardPaymentScreen;

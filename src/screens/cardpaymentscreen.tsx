import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../constants';
import { Button } from '../components';
import { PaystackWebView } from '../components/PaystackWebView';
import { 
  initializeBookingPayment, 
  verifyPayment,
  calculatePaymentSplit,
} from '../services/paystackService';
import { creditWallet } from '../services/walletService';
import { auth, db } from '../config/firebase';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';

interface CardPaymentScreenProps {
  onNavigateBack: () => void;
  onPaymentComplete: (paymentMethod: string) => void;
  totalAmount: number;
  bookingData?: {
    bookingId: string;
    vendorId: string;
    carId: string;
    carName: string;
    duration: string;
  };
}

export const CardPaymentScreen: React.FC<CardPaymentScreenProps> = ({
  onNavigateBack,
  onPaymentComplete,
  totalAmount,
  bookingData,
}) => {
  const [loading, setLoading] = useState(false);
  const [showPaystack, setShowPaystack] = useState(false);
  const [authorizationUrl, setAuthorizationUrl] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [userEmail, setUserEmail] = useState('');

  // Get user email on mount
  useEffect(() => {
    const fetchUserEmail = async () => {
      const user = auth.currentUser;
      if (user) {
        // Try to get email from auth
        if (user.email) {
          setUserEmail(user.email);
        } else {
          // Fallback: get from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserEmail(userDoc.data().email || '');
          }
        }
      }
    };
    fetchUserEmail();
  }, []);

  // Calculate split
  const split = calculatePaymentSplit(totalAmount);

  // Initialize payment
  const handlePayNow = async () => {
    if (!userEmail) {
      Alert.alert('Error', 'Could not retrieve your email. Please try again.');
      return;
    }

    if (!bookingData) {
      Alert.alert('Error', 'Booking data is missing.');
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please log in to continue.');
        setLoading(false);
        return;
      }

      // Initialize payment with Paystack
      const result = await initializeBookingPayment(
        userEmail,
        totalAmount,
        {
          bookingId: bookingData.bookingId,
          userId: user.uid,
          vendorId: bookingData.vendorId,
          carId: bookingData.carId,
          carName: bookingData.carName,
          duration: bookingData.duration,
        }
      );

      if (result.success && result.authorizationUrl) {
        setAuthorizationUrl(result.authorizationUrl);
        setPaymentReference(result.reference || '');
        setShowPaystack(true);
      } else {
        Alert.alert('Payment Error', result.error || 'Failed to initialize payment');
      }
    } catch (error: any) {
      console.error('Payment initialization error:', error);
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = async (reference: string) => {
    setShowPaystack(false);
    setLoading(true);

    try {
      // Verify payment with Paystack
      const verification = await verifyPayment(reference);

      if (verification.success) {
        // Update booking status
        if (bookingData?.bookingId) {
          await updateDoc(doc(db, 'bookings', bookingData.bookingId), {
            paymentStatus: 'paid',
            paymentReference: reference,
            paymentMethod: 'card',
            paidAt: serverTimestamp(),
          });
        }

        // Credit vendor wallet (90%)
        if (bookingData?.vendorId) {
          await creditWallet(
            bookingData.vendorId,
            split.vendorAmount,
            `Booking payment: ${bookingData.carName}`,
            'booking_payment',
            'card',
            reference
          );
        }

        Alert.alert(
          '✅ Payment Successful!',
          `Your payment of ₦${totalAmount.toLocaleString()} has been processed.`,
          [
            {
              text: 'Continue',
              onPress: () => onPaymentComplete('card'),
            },
          ]
        );
      } else {
        Alert.alert('Payment Verification Failed', verification.error || 'Please contact support.');
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      Alert.alert('Error', 'Payment verification failed. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancelled payment
  const handlePaymentCancel = () => {
    setShowPaystack(false);
    Alert.alert('Payment Cancelled', 'You cancelled the payment. Please try again.');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Card Payment</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Amount Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount to Pay</Text>
          <Text style={styles.amountText}>₦{totalAmount.toLocaleString()}</Text>
        </View>

        {/* Payment Split Info */}
        <View style={styles.splitCard}>
          <Text style={styles.splitTitle}>Payment Breakdown</Text>
          
          <View style={styles.splitRow}>
            <Text style={styles.splitLabel}>Car Rental</Text>
            <Text style={styles.splitValue}>₦{split.vendorAmount.toLocaleString()}</Text>
          </View>
          
          <View style={styles.splitRow}>
            <Text style={styles.splitLabel}>Service Fee ({split.commissionRate}%)</Text>
            <Text style={styles.splitValue}>₦{split.escardiaCommission.toLocaleString()}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.splitRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₦{totalAmount.toLocaleString()}</Text>
          </View>
        </View>

        {/* Booking Summary */}
        {bookingData && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Booking Summary</Text>
            <Text style={styles.summaryText}>🚗 {bookingData.carName}</Text>
            <Text style={styles.summaryText}>⏱️ {bookingData.duration}</Text>
          </View>
        )}

        {/* Payment Methods Info */}
        <View style={styles.methodsCard}>
          <Text style={styles.methodsTitle}>💳 Accepted Payment Methods</Text>
          <Text style={styles.methodsText}>
            • Visa / Mastercard / Verve{'\n'}
            • Bank Transfer{'\n'}
            • USSD{'\n'}
            • Bank Account
          </Text>
        </View>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Text style={styles.securityText}>
            🔒 Your payment is secured with 256-bit SSL encryption via Paystack
          </Text>
        </View>

        {/* Pay Button */}
        <Button
          title={loading ? 'Processing...' : `Pay ₦${totalAmount.toLocaleString()}`}
          onPress={handlePayNow}
          disabled={loading}
          style={styles.payButton}
        />

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Initializing payment...</Text>
          </View>
        )}
      </ScrollView>

      {/* Paystack WebView Modal */}
      <PaystackWebView
        visible={showPaystack}
        authorizationUrl={authorizationUrl}
        reference={paymentReference}
        onSuccess={handlePaymentSuccess}
        onCancel={handlePaymentCancel}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
  },
  backArrow: {
    fontSize: 20,
    color: colors.text,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  amountCard: {
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  amountText: {
    fontSize: 36,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  splitCard: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  splitTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  splitLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  splitValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  totalLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  totalValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  summaryCard: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  summaryTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  summaryText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  methodsCard: {
    backgroundColor: colors.info + '15',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  methodsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  methodsText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  securityNote: {
    padding: spacing.md,
    backgroundColor: colors.success + '15',
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  securityText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  payButton: {
    marginTop: spacing.md,
  },
  loadingOverlay: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
});

export default CardPaymentScreen;
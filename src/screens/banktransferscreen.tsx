import React from 'react';
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
import { useBookingPayment } from '../hooks/useBookingPayment';

interface BankTransferScreenProps {
  onNavigateBack: () => void;
  onPaymentComplete: (paymentMethod: string) => void;
  totalAmount: number;
  bookingData?: {
    tripData: {
      car: any;
      pickupLocation: string;
      pickupMethod: string;
      rideMode: string;
      startDate: string;
      endDate: string;
      startTime: string;
      stopTime: string;
      duration: number;
      durationType: string;
    };
    escortData?: any;
  };
}

export const BankTransferScreen: React.FC<BankTransferScreenProps> = ({
  onNavigateBack,
  onPaymentComplete,
  totalAmount: quotedAmount,
  bookingData,
}) => {
  // Booking + Paystack flow (prices are set by the server).
  const pay = useBookingPayment(bookingData);
  const loading = pay.loading;
  const createdBookingId = pay.bookingId;
  const totalAmount = pay.serverTotal ?? quotedAmount;
  const showPaystack = pay.showPaystack;
  const authorizationUrl = pay.authorizationUrl;
  const paymentReference = pay.reference;

  const handlePayWithBank = async () => {
    if (!bookingData?.tripData) {
      Alert.alert('Error', 'Booking data is missing.');
      return;
    }
    const result = await pay.startPaystack();
    if (!result.ok) Alert.alert('Payment Error', result.error || 'Failed to start payment');
  };

  const handlePaymentSuccess = async (reference: string) => {
    const result = await pay.confirmPaystack(reference);
    if (result.ignored) return;
    if (result.ok) {
      Alert.alert(
        'Payment Successful',
        `Your payment of ₦${totalAmount.toLocaleString()} has been received. Your booking is confirmed.`,
        [{ text: 'Continue', onPress: () => onPaymentComplete('bank') }]
      );
    } else if (result.pending) {
      Alert.alert('Payment Processing', result.error || 'Your payment is still processing.');
    } else {
      Alert.alert('Payment Not Confirmed', result.error || 'Please contact support.');
    }
  };

  const handlePaymentCancel = async () => {
    await pay.cancelPaystack();
    Alert.alert('Payment Cancelled', 'You cancelled the payment. You can try again.');
  };

  const tripData = bookingData?.tripData;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bank Transfer</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Amount Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount to Pay</Text>
          <Text style={styles.amountText}>₦{totalAmount.toLocaleString()}</Text>
        </View>

        {/* Booking Summary */}
        {tripData && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Booking Summary</Text>
            <Text style={styles.summaryText}>🚗 {tripData.car.brand} {tripData.car.model}</Text>
            <Text style={styles.summaryText}>⏱️ {tripData.duration} {tripData.durationType}{tripData.duration > 1 ? 's' : ''}</Text>
            <Text style={styles.summaryText}>📅 {tripData.startDate} - {tripData.endDate}</Text>
          </View>
        )}

        {/* How It Works */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>🏦 How Bank Transfer Works</Text>
          <Text style={styles.instructionsText}>
            1. Click "Pay with Bank Transfer" below{'\n'}
            2. Select your bank from the list{'\n'}
            3. You'll be redirected to your bank's page{'\n'}
            4. Authorize the payment{'\n'}
            5. Payment is confirmed instantly!
          </Text>
        </View>

        {/* Supported Banks */}
        <View style={styles.banksCard}>
          <Text style={styles.banksTitle}>💳 Supported Banks</Text>
          <Text style={styles.banksText}>
            All Nigerian banks are supported including:{'\n'}
            GTBank, Access Bank, Zenith Bank, First Bank, UBA, Kuda, OPay, and more.
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
          title={loading ? 'Processing...' : `Pay ₦${totalAmount.toLocaleString()} with Bank`}
          onPress={handlePayWithBank}
          disabled={loading}
        />

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              {createdBookingId ? 'Initializing payment...' : 'Creating booking...'}
            </Text>
          </View>
        )}

        {/* Alternative Option */}
        <TouchableOpacity 
          style={styles.alternativeButton}
          onPress={onNavigateBack}
        >
          <Text style={styles.alternativeText}>← Choose different payment method</Text>
        </TouchableOpacity>
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
    fontWeight: '700',
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
    fontWeight: '700',
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
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  summaryText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  instructionsCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  instructionsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  instructionsText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  banksCard: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  banksTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  banksText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  securityNote: {
    padding: spacing.md,
    backgroundColor: '#D1FAE5',
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  securityText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
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
  alternativeButton: {
    marginTop: spacing.lg,
    alignItems: 'center',
    padding: spacing.md,
  },
  alternativeText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
  },
});

export default BankTransferScreen;
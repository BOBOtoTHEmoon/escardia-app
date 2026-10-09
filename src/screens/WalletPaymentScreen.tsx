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
import { auth } from '../config/supabase';
import { getWalletBalance } from '../services/walletService';
import { useBookingPayment } from '../hooks/useBookingPayment';

interface WalletPaymentScreenProps {
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

export const WalletPaymentScreen: React.FC<WalletPaymentScreenProps> = ({
  onNavigateBack,
  onPaymentComplete,
  totalAmount,
  bookingData,
}) => {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  // Fetch wallet balance on mount
  useEffect(() => {
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      setWalletBalance(await getWalletBalance(user.uid));
    } catch (error) {
      console.error('Error fetching wallet:', error);
      setWalletBalance(0);
    } finally {
      setLoading(false);
    }
  };

  const pay = useBookingPayment(bookingData);

  const hasSufficientBalance = walletBalance >= totalAmount;
  const balanceAfterPayment = walletBalance - totalAmount;

  // Create booking and process wallet payment
  const handlePayWithWallet = async () => {
    if (!hasSufficientBalance) {
      Alert.alert(
        'Insufficient Balance',
        `You need ₦${(totalAmount - walletBalance).toLocaleString()} more. Would you like to top up your wallet?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Top Up', onPress: onNavigateBack },
        ]
      );
      return;
    }

    if (!bookingData?.tripData) {
      Alert.alert('Error', 'Booking data is missing.');
      return;
    }

    Alert.alert(
      'Confirm Payment',
      `Pay ₦${totalAmount.toLocaleString()} from your wallet?\n\nBalance after: ₦${balanceAfterPayment.toLocaleString()}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pay Now', onPress: processWalletPayment },
      ]
    );
  };

  const processWalletPayment = async () => {
    setProcessing(true);
    // The database creates the booking, checks the price and takes the money in one step.
    const result = await pay.payWithWallet();
    setProcessing(false);

    if (!result.ok) {
      Alert.alert('Payment Failed', result.error || 'Something went wrong. Please try again.');
      fetchWalletBalance();
      return;
    }

    const newBalance = await getWalletBalance(auth.currentUser?.uid ?? '');
    Alert.alert(
      'Payment Successful',
      `₦${(pay.serverTotal ?? totalAmount).toLocaleString()} has been deducted from your wallet.\n\nNew balance: ₦${newBalance.toLocaleString()}`,
      [{ text: 'Continue', onPress: () => onPaymentComplete('wallet') }]
    );
  };

  const tripData = bookingData?.tripData;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wallet Payment</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading wallet...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet Payment</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Wallet Balance Card */}
        <View style={[styles.walletCard, !hasSufficientBalance && styles.walletCardInsufficient]}>
          <Text style={styles.walletLabel}>Wallet Balance</Text>
          <Text style={[styles.walletBalance, !hasSufficientBalance && styles.walletBalanceInsufficient]}>
            ₦{walletBalance.toLocaleString()}
          </Text>
          {!hasSufficientBalance && (
            <View style={styles.insufficientBadge}>
              <Text style={styles.insufficientText}>
                ⚠️ Insufficient funds (Need ₦{(totalAmount - walletBalance).toLocaleString()} more)
              </Text>
            </View>
          )}
        </View>

        {/* Amount Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount to Pay</Text>
          <Text style={styles.amountText}>₦{totalAmount.toLocaleString()}</Text>
        </View>

        {/* Balance After Payment */}
        {hasSufficientBalance && (
          <View style={styles.afterPaymentCard}>
            <Text style={styles.afterPaymentLabel}>Balance After Payment</Text>
            <Text style={styles.afterPaymentValue}>₦{balanceAfterPayment.toLocaleString()}</Text>
          </View>
        )}

        {/* Booking Summary */}
        {tripData && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Booking Summary</Text>
            <Text style={styles.summaryText}>🚗 {tripData.car.brand} {tripData.car.model}</Text>
            <Text style={styles.summaryText}>⏱️ {tripData.duration} {tripData.durationType}{tripData.duration > 1 ? 's' : ''}</Text>
            <Text style={styles.summaryText}>📅 {tripData.startDate} - {tripData.endDate}</Text>
          </View>
        )}

        {/* Pay Button */}
        {hasSufficientBalance ? (
          <Button
            title={processing ? 'Processing...' : `Pay ₦${totalAmount.toLocaleString()}`}
            onPress={handlePayWithWallet}
            disabled={processing}
            style={styles.payButton}
          />
        ) : (
          <Button
            title="Top Up Wallet"
            onPress={onNavigateBack}
            style={styles.topUpButton}
          />
        )}

        {processing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.processingText}>Processing payment...</Text>
          </View>
        )}

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Text style={styles.securityText}>
            🔒 Instant payment from your Escardia wallet
          </Text>
        </View>
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  walletCard: {
    backgroundColor: '#D1FAE5',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  walletCardInsufficient: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  walletLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  walletBalance: {
    fontSize: 32,
    fontWeight: '700',
    color: '#059669',
  },
  walletBalanceInsufficient: {
    color: '#DC2626',
  },
  insufficientBadge: {
    marginTop: spacing.sm,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  insufficientText: {
    fontSize: typography.fontSize.sm,
    color: '#DC2626',
    fontWeight: '500',
  },
  amountCard: {
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  amountText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
  },
  afterPaymentCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  afterPaymentLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  afterPaymentValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: '#3B82F6',
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
  payButton: {
    marginBottom: spacing.lg,
  },
  topUpButton: {
    marginBottom: spacing.lg,
    backgroundColor: '#F59E0B',
  },
  processingOverlay: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  processingText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  securityNote: {
    padding: spacing.md,
    backgroundColor: '#D1FAE5',
    borderRadius: borderRadius.md,
  },
  securityText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default WalletPaymentScreen;
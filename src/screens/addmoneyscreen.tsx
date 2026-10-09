import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../constants';
import { Button } from '../components';
import { PaystackWebView } from '../components/PaystackWebView';
import { initializeWalletFunding, verifyPayment } from '../services/paystackService';
import { getWalletBalance, formatAmount } from '../services/walletService';
import { auth } from '../config/supabase';

interface AddMoneyScreenProps {
  onNavigateBack: () => void;
  onSuccess?: () => void;
}

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000, 100000, 200000];

export const AddMoneyScreen: React.FC<AddMoneyScreenProps> = ({
  onNavigateBack,
  onSuccess,
}) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPaystack, setShowPaystack] = useState(false);
  const [authorizationUrl, setAuthorizationUrl] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [currentBalance, setCurrentBalance] = useState(0);

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        // Email is only shown on the Paystack page; the server fills it in.
        setUserEmail(user.email || 'customer');

        // Get current balance
        const balance = await getWalletBalance(user.uid);
        setCurrentBalance(balance);
      }
    };
    loadUserData();
  }, []);

  // Handle quick amount selection
  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  // Format amount input
  const handleAmountChange = (text: string) => {
    // Remove non-numeric characters
    const numericValue = text.replace(/[^0-9]/g, '');
    setAmount(numericValue);
  };

  // Get numeric amount
  const getNumericAmount = (): number => {
    return parseInt(amount) || 0;
  };

  // Initialize payment
  const handleAddMoney = async () => {
    const numericAmount = getNumericAmount();

    if (numericAmount < 100) {
      Alert.alert('Invalid Amount', 'Minimum amount is ₦100');
      return;
    }

    if (numericAmount > 10000000) {
      Alert.alert('Invalid Amount', 'Maximum amount is ₦10,000,000');
      return;
    }

    if (!userEmail) {
      Alert.alert('Error', 'Could not retrieve your email. Please try again.');
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
      const result = await initializeWalletFunding(userEmail, numericAmount, user.uid);

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
      const user = auth.currentUser;
      if (!user) return;

      // Verify payment with Paystack
      const verification = await verifyPayment(reference);

      if (verification.success) {
        // The server has already credited the wallet.
        const numericAmount = getNumericAmount();
        const newBalance = await getWalletBalance(user.uid);
        setCurrentBalance(newBalance);

        Alert.alert(
          'Wallet Funded',
          `₦${numericAmount.toLocaleString()} has been added to your wallet.\n\nNew balance: ₦${newBalance.toLocaleString()}`,
          [
            {
              text: 'Done',
              onPress: () => {
                setAmount('');
                if (onSuccess) onSuccess();
                onNavigateBack();
              },
            },
          ]
        );
      } else if (verification.pending) {
        Alert.alert('Payment Processing', verification.error || 'Your wallet will be credited as soon as the payment is confirmed.');
      } else {
        Alert.alert('Payment Not Confirmed', verification.error || 'Please contact support.');
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

  const numericAmount = getNumericAmount();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Money</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>₦{formatAmount(currentBalance)}</Text>
        </View>

        {/* Amount Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Enter Amount</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>₦</Text>
            <TextInput
              style={styles.amountInput}
              value={amount ? parseInt(amount).toLocaleString() : ''}
              onChangeText={handleAmountChange}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              maxLength={12}
            />
          </View>
          <Text style={styles.inputHint}>Minimum ₦100 • Maximum ₦10,000,000</Text>
        </View>

        {/* Quick Amounts */}
        <View style={styles.quickAmountsSection}>
          <Text style={styles.quickAmountsLabel}>Quick Select</Text>
          <View style={styles.quickAmountsGrid}>
            {QUICK_AMOUNTS.map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.quickAmountButton,
                  numericAmount === value && styles.quickAmountButtonActive,
                ]}
                onPress={() => handleQuickAmount(value)}
              >
                <Text
                  style={[
                    styles.quickAmountText,
                    numericAmount === value && styles.quickAmountTextActive,
                  ]}
                >
                  ₦{value.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* New Balance Preview */}
        {numericAmount > 0 && (
          <View style={styles.previewCard}>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Current Balance</Text>
              <Text style={styles.previewValue}>₦{formatAmount(currentBalance)}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Amount to Add</Text>
              <Text style={styles.previewValueGreen}>+₦{numericAmount.toLocaleString()}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.previewRow}>
              <Text style={styles.previewLabelBold}>New Balance</Text>
              <Text style={styles.previewValueBold}>
                ₦{formatAmount(currentBalance + numericAmount)}
              </Text>
            </View>
          </View>
        )}

        {/* Payment Methods Info */}
        <View style={styles.methodsCard}>
          <Text style={styles.methodsTitle}>💳 Payment Options</Text>
          <Text style={styles.methodsText}>
            • Debit/Credit Card (Visa, Mastercard, Verve){'\n'}
            • Bank Transfer{'\n'}
            • USSD Banking
          </Text>
        </View>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Text style={styles.securityText}>
            🔒 Secured by Paystack • Instant wallet credit
          </Text>
        </View>

        {/* Add Money Button */}
     <Button
  title={
    loading
      ? 'Processing...'
      : numericAmount > 0
      ? `Add ₦${numericAmount.toLocaleString()}`
      : 'Enter Amount'
  }
  onPress={handleAddMoney}
  disabled={loading || numericAmount < 100}
  style={styles.addButton}
/>

        {loading && (
          <View style={styles.loadingContainer}>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  balanceCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  inputSection: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginRight: spacing.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  inputHint: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  quickAmountsSection: {
    marginBottom: spacing.lg,
  },
  quickAmountsLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  quickAmountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickAmountButton: {
    width: '31%',
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickAmountButtonActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  quickAmountText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  quickAmountTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  previewCard: {
    backgroundColor: colors.success + '10',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  previewLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  previewValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
  previewValueGreen: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    fontWeight: typography.fontWeight.semiBold,
  },
  previewLabelBold: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  previewValueBold: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: colors.success + '30',
    marginVertical: spacing.sm,
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
  addButton: {
    marginTop: spacing.md,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
});

export default AddMoneyScreen;
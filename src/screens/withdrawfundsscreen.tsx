import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../constants';
import { Button } from '../components';

interface WithdrawFundsScreenProps {
  onNavigateBack: () => void;
}

export const WithdrawFundsScreen: React.FC<WithdrawFundsScreenProps> = ({
  onNavigateBack,
}) => {
  const [availableBalance, setAvailableBalance] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchBalance();
    fetchBankDetails();
  }, []);

  const fetchBalance = async () => {
    try {
      const { auth, db } = await import('../config/firebase');
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      
      const vendorId = auth.currentUser?.uid;
      if (!vendorId) {
        setLoading(false);
        return;
      }

      // Fetch completed bookings
      const q = query(
        collection(db, 'bookings'),
        where('vendorId', '==', vendorId),
        where('status', 'in', ['past', 'completed'])
      );
      
      const snapshot = await getDocs(q);
      
      // Calculate total earnings from completed bookings
      let totalEarnings = 0;
      snapshot.docs.forEach(doc => {
        const booking = doc.data();
        // Deduct platform fee (10%)
        const vendorEarnings = (booking.totalPrice || 0) * 0.9;
        totalEarnings += vendorEarnings;
      });

      // TODO: Subtract already withdrawn amounts
      setAvailableBalance(totalEarnings);
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBankDetails = async () => {
    try {
      const { auth, db } = await import('../config/firebase');
      const { doc, getDoc } = await import('firebase/firestore');
      
      const vendorId = auth.currentUser?.uid;
      if (!vendorId) return;

      const vendorDoc = await getDoc(doc(db, 'vendors', vendorId));
      if (vendorDoc.exists()) {
        const data = vendorDoc.data();
        setBankName(data.bankName || '');
        setAccountNumber(data.accountNumber || '');
        setAccountName(data.accountName || '');
      }
    } catch (error) {
      console.error('Error fetching bank details:', error);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);

    // Validation
    if (!withdrawAmount || isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (amount > availableBalance) {
      Alert.alert('Insufficient Balance', 'You cannot withdraw more than your available balance');
      return;
    }

    if (!bankName || !accountNumber || !accountName) {
      Alert.alert('Bank Details Required', 'Please add your bank details first');
      return;
    }

    if (amount < 5000) {
      Alert.alert('Minimum Amount', 'Minimum withdrawal amount is ₦5,000');
      return;
    }

    Alert.alert(
      'Confirm Withdrawal',
      `Withdraw ₦${amount.toLocaleString()} to ${bankName} - ${accountNumber}?\n\nFunds will be processed within 2-5 business days.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: processWithdrawal,
        },
      ]
    );
  };

  const processWithdrawal = async () => {
    setProcessing(true);
    try {
      const { auth, db } = await import('../config/firebase');
      const { collection, addDoc } = await import('firebase/firestore');
      
      const vendorId = auth.currentUser?.uid;
      if (!vendorId) return;

      const amount = parseFloat(withdrawAmount);

      // Create withdrawal request
      await addDoc(collection(db, 'withdrawals'), {
        vendorId,
        amount,
        bankName,
        accountNumber,
        accountName,
        status: 'pending',
        requestedAt: new Date().toISOString(),
      });

      Alert.alert(
        'Withdrawal Requested',
        'Your withdrawal request has been submitted successfully. Funds will be processed within 2-5 business days.',
        [
          {
            text: 'OK',
            onPress: () => {
              setWithdrawAmount('');
              fetchBalance();
              onNavigateBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      Alert.alert('Error', 'Failed to process withdrawal. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const setMaxAmount = () => {
    setWithdrawAmount(availableBalance.toString());
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdraw Funds</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Available Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>
            ₦{availableBalance.toLocaleString()}
          </Text>
          <Text style={styles.balanceNote}>
            After platform fee (10%) deduction
          </Text>
        </View>

        {/* Withdrawal Amount */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Withdrawal Amount</Text>
          
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>₦</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.maxButton} onPress={setMaxAmount}>
              <Text style={styles.maxButtonText}>MAX</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.minAmountText}>
            Minimum withdrawal: ₦5,000
          </Text>
        </View>

        {/* Bank Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bank Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bank Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. GTBank, Access Bank"
              placeholderTextColor={colors.textSecondary}
              value={bankName}
              onChangeText={setBankName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Number</Text>
            <TextInput
              style={styles.input}
              placeholder="0123456789"
              placeholderTextColor={colors.textSecondary}
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Account holder name"
              placeholderTextColor={colors.textSecondary}
              value={accountName}
              onChangeText={setAccountName}
            />
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Withdrawal Information</Text>
          <Text style={styles.infoText}>
            • Processing time: 2-5 business days{'\n'}
            • Minimum amount: ₦5,000{'\n'}
            • Maximum per transaction: ₦5,000,000{'\n'}
            • No withdrawal fees{'\n'}
            • Ensure bank details are correct
          </Text>
        </View>

        {/* Recent Withdrawals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Withdrawals</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No recent withdrawals</Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          title={processing ? "Processing..." : "Request Withdrawal"}
          onPress={handleWithdraw}
          disabled={processing || loading}
          style={styles.withdrawButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
  },
  backIcon: {
    fontSize: 24,
    color: colors.text,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  balanceCard: {
    backgroundColor: colors.primary,
    margin: spacing.lg,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textWhite,
    opacity: 0.9,
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    marginBottom: spacing.xs,
  },
  balanceNote: {
    fontSize: typography.fontSize.xs,
    color: colors.textWhite,
    opacity: 0.8,
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  currencySymbol: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginRight: spacing.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  maxButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  maxButtonText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  minAmountText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  infoCard: {
    backgroundColor: colors.info + '15',
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  infoTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * 1.6,
  },
  emptyState: {
    backgroundColor: colors.backgroundGray,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  bottomSpacing: {
    height: 100,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  withdrawButton: {
    width: '100%',
  },
});
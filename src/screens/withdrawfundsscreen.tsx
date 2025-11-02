// src/screens/withdrawfundsscreen.tsx
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
import {
  getBankDetails,
  requestWithdrawal,
  getRecentWithdrawals,
  BankDetails,
  Withdrawal,
} from '../services/payoutservice';

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
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  useEffect(() => {
    fetchBalance();
    fetchBankDetails();
    loadHistory();
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

      const q = query(
        collection(db, 'bookings'),
        where('vendorId', '==', vendorId),
        where('status', 'in', ['past', 'completed'])
      );
      const snapshot = await getDocs(q);

      let totalEarnings = 0;
      snapshot.docs.forEach((doc) => {
        const booking = doc.data();
        const vendorEarnings = (booking.totalPrice || 0) * 0.9;
        totalEarnings += vendorEarnings;
      });

      setAvailableBalance(totalEarnings);
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBankDetails = async () => {
    try {
      const details = await getBankDetails();
      if (details) {
        setBankName(details.bankName);
        setAccountNumber(details.accountNumber);
        setAccountName(details.accountName);
      }
    } catch (error) {
      console.error('Error fetching bank details:', error);
    }
  };

  const loadHistory = async () => {
    const history = await getRecentWithdrawals(5);
    setWithdrawals(history);
  };

  const setMaxAmount = () => {
    setWithdrawAmount(availableBalance.toString());
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);

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
        { text: 'Confirm', onPress: processWithdrawal },
      ]
    );
  };

  const processWithdrawal = async () => {
    setProcessing(true);
    try {
      const amount = parseFloat(withdrawAmount);
      const bank: BankDetails = { bankName, accountNumber, accountName };

      await requestWithdrawal(amount, bank);

      Alert.alert(
        'Withdrawal Requested',
        'Your withdrawal request has been submitted successfully. Funds will be processed within 2-5 business days.',
        [
          {
            text: 'OK',
            onPress: () => {
              setWithdrawAmount('');
              fetchBalance();
              loadHistory();
              onNavigateBack();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error processing withdrawal:', error);
      Alert.alert('Error', error.message || 'Failed to process withdrawal. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backIcon}>Back</Text>
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
              editable={false}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Number</Text>
            <TextInput
              style={styles.input}
              placeholder="0123456789"
              placeholderTextColor={colors.textSecondary}
              value={accountNumber}
              editable={false}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Account holder name"
              placeholderTextColor={colors.textSecondary}
              value={accountName}
              editable={false}
            />
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Withdrawal Information</Text>
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
          {withdrawals.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No recent withdrawals</Text>
            </View>
          ) : (
            <View>
              {withdrawals.map((w) => (
                <View key={w.id} style={styles.historyItem}>
                  <View>
                    <Text style={styles.historyAmount}>₦{w.amount.toLocaleString()}</Text>
                    <Text style={styles.historyBank}>{w.bankName} • {w.accountNumber.slice(-4)}</Text>
                  </View>
                  <View style={styles.historyRight}>
                    <Text
                      style={[
                        styles.historyStatus,
                        w.status === 'completed' && styles.statusSuccess,
                        w.status === 'pending' && styles.statusPending,
                      ]}
                    >
                      {w.status.toUpperCase()}
                    </Text>
                    <Text style={styles.historyDate}>
                      {new Date(w.requestedAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          title={processing ? 'Processing...' : 'Request Withdrawal'}
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
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  historyAmount: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.text,
  },
  historyBank: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyStatus: {
    fontSize: typography.fontSize.xs,
    fontWeight: 'bold',
  },
  statusSuccess: { color: '#10B981' },
  statusPending: { color: '#F59E0B' },
  historyDate: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
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
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../constants';
import { Button } from '../components';
import {
  NIGERIAN_BANKS,
  getBankList,
  verifyBankAccount,
  saveVendorBankAccount,
  requestWithdrawal,
} from '../services/paystackService';
import { getWalletBalances, formatAmount } from '../services/walletService';
import { supabase, auth } from '../config/supabase';

interface WithdrawFundsScreenProps {
  onNavigateBack: () => void;
  onNavigateToBankDetails?: () => void;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  bankName: string;
  accountNumber: string;
  createdAt: any;
}

export const WithdrawFundsScreen: React.FC<WithdrawFundsScreenProps> = ({
  onNavigateBack,
  onNavigateToBankDetails,
}) => {
  // State
  const [availableBalance, setAvailableBalance] = useState(0);
  const [onHoldBalance, setOnHoldBalance] = useState(0);
  const [banks, setBanks] = useState<{ name: string; code: string }[]>(NIGERIAN_BANKS);
  const [savedAccount, setSavedAccount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  
  // Bank details
  const [selectedBank, setSelectedBank] = useState<{ name: string; code: string } | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [recipientCode, setRecipientCode] = useState('');
  const [showBankPicker, setShowBankPicker] = useState(false);
  
  // Recent withdrawals
  const [recentWithdrawals, setRecentWithdrawals] = useState<Withdrawal[]>([]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Auto-verify account when number is complete
  useEffect(() => {
    if (accountNumber.length === 10 && selectedBank) {
      verifyAccount();
    } else {
      setAccountName('');
    }
  }, [accountNumber, selectedBank]);

  const loadData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      // Available = withdrawable now. On hold = trips not yet completed + 24h window.
      const { available, pending } = await getWalletBalances(user.uid);
      setAvailableBalance(available);
      setOnHoldBalance(pending);

      // Full Paystack bank list (falls back to the common banks).
      getBankList().then((r) => r.banks?.length && setBanks(r.banks));

      // Saved payout account
      const { data: vp } = await supabase
        .from('vendor_private')
        .select('bank_name, bank_code, account_number, account_name, paystack_recipient_code')
        .eq('vendor_id', user.uid)
        .maybeSingle();
      if (vp?.account_number) {
        setSelectedBank({ name: vp.bank_name ?? '', code: vp.bank_code ?? '' });
        setAccountNumber(vp.account_number);
        setAccountName(vp.account_name ?? '');
        setSavedAccount(`${vp.bank_code}:${vp.account_number}`);
      }

      await loadRecentWithdrawals(user.uid);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentWithdrawals = async (vendorId: string) => {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('id, amount, status, bank_name, account_number, created_at')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(5);
    if (error) return;
    setRecentWithdrawals(
      (data ?? []).map((w) => ({
        id: w.id,
        amount: Number(w.amount),
        status: w.status === 'pending_approval' ? 'pending' : w.status === 'approved' ? 'processing' : w.status,
        bankName: w.bank_name ?? '',
        accountNumber: w.account_number ?? '',
        createdAt: w.created_at,
      }))
    );
  };

  // Check the account name with the bank (Paystack, via the server)
  const verifyAccount = async () => {
    if (!selectedBank || accountNumber.length !== 10) return;
    if (savedAccount === `${selectedBank.code}:${accountNumber}` && accountName) return; // already saved

    setVerifyingAccount(true);
    setAccountName('');
    try {
      const result = await verifyBankAccount(accountNumber, selectedBank.code);
      if (result.success && result.accountName) {
        setAccountName(result.accountName);
      } else {
        Alert.alert('Verification Failed', result.error || 'Could not verify account');
      }
    } finally {
      setVerifyingAccount(false);
    }
  };

  // Handle withdrawal
  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);

    if (!withdrawAmount || isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }
    if (amount < 1000) {
      Alert.alert('Minimum Amount', 'Minimum withdrawal is ₦1,000');
      return;
    }
    if (amount > availableBalance) {
      Alert.alert('Insufficient Balance', 'You cannot withdraw more than your available balance');
      return;
    }
    if (!selectedBank || !accountNumber || !accountName) {
      Alert.alert('Bank Details Required', 'Please add and verify your bank details first');
      return;
    }

    Alert.alert(
      'Confirm Withdrawal',
      `Withdraw ₦${amount.toLocaleString()} to:\n\n${selectedBank.name}\n${accountNumber}\n${accountName}\n\nTransfer fee: ₦50`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: processWithdrawal },
      ]
    );
  };

  // Request the payout. Escardia reviews it and the server sends the money.
  const processWithdrawal = async () => {
    setProcessing(true);
    const amount = parseFloat(withdrawAmount);
    try {
      // Save the account first if it is new or changed.
      if (savedAccount !== `${selectedBank!.code}:${accountNumber}`) {
        const saved = await saveVendorBankAccount(accountNumber, selectedBank!.code, selectedBank!.name);
        if (!saved.success) throw new Error(saved.error || 'Could not save your bank account');
        setSavedAccount(`${selectedBank!.code}:${accountNumber}`);
      }

      const result = await requestWithdrawal(amount);
      if (!result.success) throw new Error(result.error || 'Withdrawal failed');

      Alert.alert(
        'Withdrawal Requested',
        `₦${(amount - 50).toLocaleString()} will be sent to your account once Escardia approves it, usually within 24 hours.`,
        [
          {
            text: 'Done',
            onPress: () => {
              setWithdrawAmount('');
              loadData();
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Withdrawal Failed', error.message || 'Please try again later');
    } finally {
      setProcessing(false);
    }
  };

  // Set max amount
  const setMaxAmount = () => {
    setWithdrawAmount(availableBalance.toString());
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return colors.success;
      case 'processing': return colors.warning;
      case 'pending': return colors.info;
      case 'failed': return '#EF4444';
      default: return colors.textSecondary;
    }
  };

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Withdraw Funds</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

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
          <Text style={styles.balanceAmount}>₦{formatAmount(availableBalance)}</Text>
          <Text style={styles.balanceNote}>Ready to withdraw</Text>
          {onHoldBalance > 0 && (
            <Text style={styles.balanceNote}>
              ₦{formatAmount(onHoldBalance)} on hold until trips are completed
            </Text>
          )}
        </View>

        {/* Withdrawal Amount */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amount to Withdraw</Text>
          
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>₦</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              value={withdrawAmount}
              onChangeText={(text) => setWithdrawAmount(text.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.maxButton} onPress={setMaxAmount}>
              <Text style={styles.maxButtonText}>MAX</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.amountInfo}>
            <Text style={styles.infoText}>Min: ₦1,000</Text>
            <Text style={styles.infoText}>Transfer fee: ₦50</Text>
          </View>
        </View>

        {/* Bank Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bank Account</Text>

          {/* Bank Selector */}
          <TouchableOpacity
            style={styles.bankSelector}
            onPress={() => setShowBankPicker(!showBankPicker)}
          >
            <Text style={selectedBank ? styles.bankSelectorText : styles.bankSelectorPlaceholder}>
              {selectedBank ? selectedBank.name : 'Select Bank'}
            </Text>
            <Text style={styles.dropdownIcon}>{showBankPicker ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {/* Bank List */}
          {showBankPicker && (
            <View style={styles.bankList}>
              <ScrollView style={styles.bankListScroll} nestedScrollEnabled>
                {banks.map((bank) => (
                  <TouchableOpacity
                    key={bank.code}
                    style={[
                      styles.bankItem,
                      selectedBank?.code === bank.code && styles.bankItemActive,
                    ]}
                    onPress={() => {
                      setSelectedBank(bank);
                      setShowBankPicker(false);
                      setAccountName(''); // Reset account name when bank changes
                    }}
                  >
                    <Text
                      style={[
                        styles.bankItemText,
                        selectedBank?.code === bank.code && styles.bankItemTextActive,
                      ]}
                    >
                      {bank.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Account Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 10-digit account number"
              placeholderTextColor={colors.textSecondary}
              value={accountNumber}
              onChangeText={(text) => setAccountNumber(text.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          {/* Account Name (Auto-verified) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Name</Text>
            <View style={styles.verifiedContainer}>
              {verifyingAccount ? (
                <View style={styles.verifyingRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.verifyingText}>Verifying account...</Text>
                </View>
              ) : accountName ? (
                <View style={styles.verifiedRow}>
                  <Text style={styles.verifiedIcon}>✓</Text>
                  <Text style={styles.verifiedName}>{accountName}</Text>
                </View>
              ) : (
                <Text style={styles.notVerifiedText}>
                  {selectedBank && accountNumber.length === 10
                    ? 'Could not verify account'
                    : 'Will auto-verify when you enter account number'}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Fee Breakdown */}
        {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
          <View style={styles.feeCard}>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Amount</Text>
              <Text style={styles.feeValue}>₦{parseFloat(withdrawAmount).toLocaleString()}</Text>
            </View>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Transfer Fee</Text>
              <Text style={styles.feeValue}>-₦50</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.feeRow}>
              <Text style={styles.totalLabel}>You'll Receive</Text>
              <Text style={styles.totalValue}>
                ₦{Math.max(0, parseFloat(withdrawAmount) - 50).toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        {/* Recent Withdrawals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Withdrawals</Text>
          
          {recentWithdrawals.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No withdrawals yet</Text>
            </View>
          ) : (
            recentWithdrawals.map((withdrawal) => (
              <View key={withdrawal.id} style={styles.withdrawalItem}>
                <View style={styles.withdrawalLeft}>
                  <Text style={styles.withdrawalAmount}>
                    ₦{withdrawal.amount.toLocaleString()}
                  </Text>
                  <Text style={styles.withdrawalBank}>
                    {withdrawal.bankName} • {withdrawal.accountNumber.slice(-4)}
                  </Text>
                </View>
                <View style={styles.withdrawalRight}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(withdrawal.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(withdrawal.status) }]}>
                      {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                    </Text>
                  </View>
                  <Text style={styles.withdrawalDate}>{formatDate(withdrawal.createdAt)}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Quick Info</Text>
          <Text style={styles.infoContent}>
            • Transfers are processed instantly via Paystack{'\n'}
            • You'll receive funds within minutes{'\n'}
            • Transfer fee of ₦50 applies per withdrawal{'\n'}
            • Minimum withdrawal is ₦1,000
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          title={processing ? "Processing..." : "Withdraw"}
          onPress={handleWithdraw}
          disabled={processing || !accountName || parseFloat(withdrawAmount) < 1000}
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  balanceNote: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.7)',
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
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
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
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
    paddingVertical: spacing.md,
  },
  maxButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  maxButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  amountInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  infoText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  bankSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bankSelectorText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  bankSelectorPlaceholder: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  dropdownIcon: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bankList: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bankListScroll: {
    maxHeight: 200,
  },
  bankItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bankItemActive: {
    backgroundColor: colors.primary + '15',
  },
  bankItemText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  bankItemTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semiBold,
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
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  verifiedContainer: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  verifyingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifyingText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedIcon: {
    fontSize: 16,
    color: colors.success,
    marginRight: spacing.sm,
    fontWeight: 'bold',
  },
  verifiedName: {
    fontSize: typography.fontSize.base,
    color: colors.success,
    fontWeight: typography.fontWeight.semiBold,
  },
  notVerifiedText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  feeCard: {
    backgroundColor: colors.inputBackground,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  feeLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  feeValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  totalLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  totalValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
  },
  emptyState: {
    backgroundColor: colors.inputBackground,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  withdrawalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  withdrawalLeft: {
    flex: 1,
  },
  withdrawalAmount: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: 2,
  },
  withdrawalBank: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  withdrawalRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginBottom: 4,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
  },
  withdrawalDate: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  infoCard: {
    backgroundColor: colors.info + '15',
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  infoTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  infoContent: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
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

export default WithdrawFundsScreen;
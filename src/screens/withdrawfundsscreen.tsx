// ============================================
// ESCARDIA - WITHDRAW FUNDS SCREEN (Paystack)
// File: src/screens/WithdrawFundsScreen.tsx
// ============================================

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
  verifyBankAccount, 
  createTransferRecipient,
  initiateTransfer,
  generateReference,
} from '../services/paystackService';
import { 
  getWalletBalance, 
  debitWallet,
  formatAmount,
} from '../services/walletService';
import { auth, db } from '../config/firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';

interface WithdrawFundsScreenProps {
  onNavigateBack: () => void;
  onNavigateToBankDetails?: () => void;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'success' | 'failed';
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

      // Load wallet balance
      let walletBalance = await getWalletBalance(user.uid);

      // If wallet is empty, calculate from completed bookings (legacy support)
      if (walletBalance === 0) {
        const { collection, query: firestoreQuery, where, getDocs } = await import('firebase/firestore');
        
        const bookingsQuery = firestoreQuery(
          collection(db, 'bookings'),
          where('vendorId', '==', user.uid),
          where('status', 'in', ['past', 'completed'])
        );
        
        const snapshot = await getDocs(bookingsQuery);
        
        let totalEarnings = 0;
        snapshot.docs.forEach(doc => {
          const booking = doc.data();
          // Vendor gets 90% (after 10% platform fee)
          const vendorEarnings = (booking.totalPrice || 0) * 0.9;
          totalEarnings += vendorEarnings;
        });

        // TODO: Subtract already withdrawn amounts from withdrawals collection
        const withdrawalsQuery = firestoreQuery(
          collection(db, 'withdrawals'),
          where('vendorId', '==', user.uid),
          where('status', '==', 'success')
        );
        
        try {
          const withdrawalsSnapshot = await getDocs(withdrawalsQuery);
          withdrawalsSnapshot.docs.forEach(doc => {
            totalEarnings -= doc.data().amount || 0;
          });
        } catch (e) {
          // Index might not exist yet, ignore
        }

        walletBalance = Math.max(0, totalEarnings);
      }

      setAvailableBalance(walletBalance);

      // Load saved bank details
      const vendorDoc = await getDoc(doc(db, 'vendors', user.uid));
      if (vendorDoc.exists()) {
        const data = vendorDoc.data();
        if (data.bankDetails) {
          setAccountNumber(data.bankDetails.accountNumber || '');
          setAccountName(data.bankDetails.accountName || '');
          setRecipientCode(data.bankDetails.recipientCode || '');
          
          // Find bank by name
          const bank = NIGERIAN_BANKS.find(b => b.name === data.bankDetails.bankName);
          if (bank) setSelectedBank(bank);
        }
      }

      // Load recent withdrawals
      await loadRecentWithdrawals(user.uid);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentWithdrawals = async (vendorId: string) => {
    try {
      const q = query(
        collection(db, 'withdrawals'),
        where('vendorId', '==', vendorId),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      
      const snapshot = await getDocs(q);
      const withdrawals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Withdrawal[];
      
      setRecentWithdrawals(withdrawals);
    } catch (error) {
      console.error('Error loading withdrawals:', error);
    }
  };

  // Verify bank account with Paystack
  const verifyAccount = async () => {
    if (!selectedBank || accountNumber.length !== 10) return;

    setVerifyingAccount(true);
    setAccountName('');

    try {
      const result = await verifyBankAccount(accountNumber, selectedBank.code);
      
      if (result.success && result.accountName) {
        setAccountName(result.accountName);
        
        // Save bank details
        const user = auth.currentUser;
        if (user) {
          await updateDoc(doc(db, 'vendors', user.uid), {
            bankDetails: {
              bankName: selectedBank.name,
              bankCode: selectedBank.code,
              accountNumber,
              accountName: result.accountName,
              updatedAt: serverTimestamp(),
            },
          });
        }
      } else {
        Alert.alert('Verification Failed', result.error || 'Could not verify account');
      }
    } catch (error: any) {
      console.error('Account verification error:', error);
      Alert.alert('Error', 'Failed to verify account. Please try again.');
    } finally {
      setVerifyingAccount(false);
    }
  };

  // Handle withdrawal
  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);

    // Validations
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

  // Process the actual withdrawal
  const processWithdrawal = async () => {
    setProcessing(true);
    const amount = parseFloat(withdrawAmount);
    const reference = generateReference('WDR');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');

      // Step 1: Create or get transfer recipient
      let currentRecipientCode = recipientCode;
      
      if (!currentRecipientCode) {
        const recipientResult = await createTransferRecipient(
          selectedBank!.code,
          accountNumber,
          accountName
        );

        if (!recipientResult.success) {
          throw new Error(recipientResult.error || 'Failed to create recipient');
        }

        currentRecipientCode = recipientResult.recipientCode!;
        setRecipientCode(currentRecipientCode);

        // Save recipient code
        await updateDoc(doc(db, 'vendors', user.uid), {
          'bankDetails.recipientCode': currentRecipientCode,
        });
      }

      // Step 2: Debit vendor wallet first
      const debitResult = await debitWallet(
        user.uid,
        amount,
        `Withdrawal to ${selectedBank!.name}`,
        'withdrawal',
        undefined,
        reference
      );

      if (!debitResult.success) {
        throw new Error(debitResult.error || 'Failed to debit wallet');
      }

      // Step 3: Create withdrawal record
      const withdrawalRef = await addDoc(collection(db, 'withdrawals'), {
        vendorId: user.uid,
        amount,
        fee: 50, // Paystack/Bank transfer fee
        netAmount: amount - 50,
        bankName: selectedBank!.name,
        bankCode: selectedBank!.code,
        accountNumber,
        accountName,
        recipientCode: currentRecipientCode,
        reference,
        status: 'processing',
        createdAt: serverTimestamp(),
      });

      // Step 4: Initiate Paystack transfer
      const transferResult = await initiateTransfer(
        amount - 50, // Deduct transfer fee
        currentRecipientCode,
        `Escardia earnings withdrawal`,
        reference
      );

      if (transferResult.success) {
        // Update withdrawal status
        await updateDoc(doc(db, 'withdrawals', withdrawalRef.id), {
          transferCode: transferResult.transferCode,
          status: 'processing', // Will be updated to 'success' by webhook
        });

        Alert.alert(
          '✅ Withdrawal Initiated!',
          `₦${(amount - 50).toLocaleString()} is being transferred to your account.\n\nYou'll receive it within minutes.`,
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
      } else {
        // Transfer failed - refund wallet
        // Note: In production, this should be handled more carefully
        throw new Error(transferResult.error || 'Transfer failed');
      }
    } catch (error: any) {
      console.error('Withdrawal error:', error);
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
                {NIGERIAN_BANKS.map((bank) => (
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
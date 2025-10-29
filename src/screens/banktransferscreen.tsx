// ============================================
// BANK TRANSFER SCREEN
// ============================================
// File: src/screens/BankTransferScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Clipboard,
  Alert,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../constants';
import { Button } from '../components';

interface BankTransferScreenProps {
  onNavigateBack: () => void;
  onPaymentComplete: () => void;
  totalAmount: number;
}

export const BankTransferScreen: React.FC<BankTransferScreenProps> = ({
  onNavigateBack,
  onPaymentComplete,
  totalAmount,
}) => {
  const [hasCopied, setHasCopied] = useState<string | null>(null);

  // Bank account details (replace with your actual details)
  const bankDetails = {
    bankName: 'Guarantee Trust Bank',
    accountNumber: '0123456789',
    accountName: 'Escardia Technologies Ltd',
  };

  const copyToClipboard = (text: string, field: string) => {
    Clipboard.setString(text);
    setHasCopied(field);
    Alert.alert('Copied!', `${field} copied to clipboard`);
    setTimeout(() => setHasCopied(null), 2000);
  };

  const handleConfirmPayment = () => {
    Alert.alert(
      'Confirm Payment',
      'Have you completed the bank transfer?',
      [
        {
          text: 'Not Yet',
          style: 'cancel',
        },
        {
          text: 'Yes, I have',
          onPress: () => {
            alert('We will verify your payment and confirm your booking shortly.');
            onPaymentComplete();
          },
        },
      ]
    );
  };

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
          <Text style={styles.amountLabel}>Amount to Transfer</Text>
          <Text style={styles.amountText}>₦{totalAmount.toLocaleString()}</Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>📋 Transfer Instructions</Text>
          <Text style={styles.instructionsText}>
            1. Open your banking app{'\n'}
            2. Transfer the exact amount to the account below{'\n'}
            3. Come back and click "I've Made the Transfer"{'\n'}
            4. We'll verify and confirm your booking
          </Text>
        </View>

        {/* Bank Details */}
        <View style={styles.bankDetailsCard}>
          <Text style={styles.sectionTitle}>Bank Account Details</Text>

          {/* Bank Name */}
          <View style={styles.detailRow}>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Bank Name</Text>
              <Text style={styles.detailValue}>{bankDetails.bankName}</Text>
            </View>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => copyToClipboard(bankDetails.bankName, 'Bank Name')}>
              <Text style={styles.copyButtonText}>
                {hasCopied === 'Bank Name' ? '✓' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Account Number */}
          <View style={styles.detailRow}>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Account Number</Text>
              <Text style={styles.detailValue}>{bankDetails.accountNumber}</Text>
            </View>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => copyToClipboard(bankDetails.accountNumber, 'Account Number')}>
              <Text style={styles.copyButtonText}>
                {hasCopied === 'Account Number' ? '✓' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Account Name */}
          <View style={styles.detailRow}>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Account Name</Text>
              <Text style={styles.detailValue}>{bankDetails.accountName}</Text>
            </View>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => copyToClipboard(bankDetails.accountName, 'Account Name')}>
              <Text style={styles.copyButtonText}>
                {hasCopied === 'Account Name' ? '✓' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Important Note */}
        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>⚠️ Important</Text>
          <Text style={styles.noteText}>
            • Transfer the EXACT amount shown above{'\n'}
            • Payment verification may take 5-30 minutes{'\n'}
            • Keep your transfer receipt for reference{'\n'}
            • Contact support if payment isn't confirmed within 1 hour
          </Text>
        </View>

        {/* Confirm Button */}
        <Button
          title="I've Made the Transfer"
          onPress={handleConfirmPayment}
          style={styles.confirmButton}
        />

        {/* Support Link */}
        <TouchableOpacity style={styles.supportLink}>
          <Text style={styles.supportText}>Need help? Contact Support</Text>
        </TouchableOpacity>
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
    borderRadius: borderRadius.md,
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
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  instructionsCard: {
    backgroundColor: colors.info + '15',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  instructionsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  instructionsText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * 1.6,
  },
  bankDetailsCard: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
  },
  copyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  copyButtonText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  noteCard: {
    backgroundColor: colors.warning + '20',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  noteTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  noteText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * 1.5,
  },
  confirmButton: {
    marginBottom: spacing.md,
  },
  supportLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  supportText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
});

export default BankTransferScreen;
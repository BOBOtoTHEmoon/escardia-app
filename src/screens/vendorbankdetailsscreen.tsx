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
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../constants';
import { NIGERIAN_BANKS } from '../services/paystackService';

interface VendorBankDetailsScreenProps {
  onNavigateBack: () => void;
}

export const VendorBankDetailsScreen: React.FC<VendorBankDetailsScreenProps> = ({
  onNavigateBack,
}) => {
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bankName, setBankName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBankDetails();
  }, []);

  const loadBankDetails = async () => {
    try {
      const { supabase, auth } = await import('../config/supabase');
      const vendorId = auth.currentUser?.uid;
      if (!vendorId) return;

      const { data } = await supabase
        .from('vendor_private')
        .select('bank_name, account_number, account_name')
        .eq('vendor_id', vendorId)
        .maybeSingle();
      if (data) {
        setAccountNumber(data.account_number || '');
        setAccountName(data.account_name || '');
        setBankName(data.bank_name || '');
      }
    } catch (error) {
      console.error('Error loading bank details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!accountNumber || !bankName) {
      Alert.alert('Error', 'Please choose your bank and enter your account number');
      return;
    }

    if (accountNumber.length !== 10) {
      Alert.alert('Error', 'Account number must be 10 digits');
      return;
    }

    setSaving(true);
    try {
      // The bank confirms the account name; payouts can only go to a verified account.
      const { saveVendorBankAccount, NIGERIAN_BANKS } = await import('../services/paystackService');
      const bank = NIGERIAN_BANKS.find((b) => b.name === bankName);
      if (!bank) throw new Error('Please choose your bank from the list');

      const result = await saveVendorBankAccount(accountNumber, bank.code, bank.name);
      if (!result.success) throw new Error(result.error);
      setAccountName(result.accountName || accountName);

      Alert.alert('Success', `Bank details saved.\n\nAccount name: ${result.accountName}`);
    } catch (error) {
      console.error('Error saving bank details:', error);
      Alert.alert('Error', (error as Error)?.message || 'Failed to save bank details');
    } finally {
      setSaving(false);
    }
  };

  const nigerianBanks = NIGERIAN_BANKS.map((b) => b.name);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bank Details</Text>
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
        <Text style={styles.headerTitle}>Bank Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💳 Payment Account</Text>
          <Text style={styles.sectionSubtitle}>
            Add your bank account details to receive payments
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bank Name *</Text>
            <View style={styles.pickerContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.bankScroll}
              >
                {nigerianBanks.map((bank, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.bankChip,
                      bankName === bank && styles.bankChipActive,
                    ]}
                    onPress={() => setBankName(bank)}
                  >
                    <Text
                      style={[
                        styles.bankChipText,
                        bankName === bank && styles.bankChipTextActive,
                      ]}
                    >
                      {bank}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Number *</Text>
            <TextInput
              style={styles.input}
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="Enter 10-digit account number"
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Name *</Text>
            <TextInput
              style={styles.input}
              value={accountName}
              editable={false}
              placeholder="Filled in automatically by your bank"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <Text style={styles.infoText}>
              Ensure your account details are correct. Withdrawals will be sent to this account.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.textWhite} />
            ) : (
              <Text style={styles.saveButtonText}>💾 Save Bank Details</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
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
  pickerContainer: {
    marginBottom: spacing.sm,
  },
  bankScroll: {
    marginTop: spacing.sm,
  },
  bankChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  bankChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  bankChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  bankChipTextActive: {
    color: colors.textWhite,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '15',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
  },
  bottomSpacing: {
    height: 40,
  },
});
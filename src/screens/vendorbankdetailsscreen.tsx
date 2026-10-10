// Payout account: the bank confirms the account name before it is saved.
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { getBankList, saveVendorBankAccount, verifyBankAccount, NIGERIAN_BANKS } from '../services/paystackService';
import { getBankAccount, BankAccount } from '../services/vendorService';
import { AppText, Banner, Button, Screen, ScreenHeader, TextField } from '../ui';
import { BottomBar } from '../ui/Booking';
import { SearchPicker } from '../ui/Kit';
import { brand, color, gutter, radius, themed, statusBarStyle } from '../theme';

interface VendorBankDetailsScreenProps {
  onNavigateBack: () => void;
}

type Bank = { name: string; code: string };

export const VendorBankDetailsScreen: React.FC<VendorBankDetailsScreenProps> = ({ onNavigateBack }) => {
  const [current, setCurrent] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [banks, setBanks] = useState<Bank[]>(NIGERIAN_BANKS);
  const [bank, setBank] = useState<Bank | null>(null);
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [picker, setPicker] = useState(false);
  const lookup = useRef(0);

  useEffect(() => {
    getBankAccount().then((a) => {
      setCurrent(a);
      setEditing(!a);
      setLoading(false);
    });
    getBankList().then((r) => r.banks?.length && setBanks(r.banks));
  }, []);

  // Ask the bank for the account name as soon as all 10 digits are in.
  useEffect(() => {
    setName('');
    setCheckError('');
    if (!bank || number.length !== 10) return;
    const id = ++lookup.current;
    setChecking(true);
    verifyBankAccount(number, bank.code).then((r) => {
      if (id !== lookup.current) return;
      setChecking(false);
      if (r.success && r.accountName) setName(r.accountName);
      else setCheckError(r.error || 'We could not find this account. Check the number and bank.');
    });
  }, [bank, number]);

  const save = async () => {
    if (!bank || !name) return;
    setSaving(true);
    const r = await saveVendorBankAccount(number, bank.code, bank.name);
    setSaving(false);
    if (!r.success) return setCheckError(r.error || 'Could not save the account. Please try again.');
    setCurrent({ bankName: r.bankName || bank.name, bankCode: bank.code, accountNumber: number, accountName: r.accountName || name });
    setEditing(false);
    setSaved(true);
  };

  return (
    <Screen>
      <StatusBar style={statusBarStyle()} />
      <ScreenHeader title="Payout account" subtitle="Where your withdrawals are sent" onBack={onNavigateBack} />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={color.primary} />
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
            {saved && <Banner tone="success" text="Your payout account is saved. Withdrawals will go here." />}

            {current && !editing && (
              <>
                <View style={styles.cardAccount}>
                  <View style={styles.glow} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={styles.bankIcon}>
                      <Feather name="home" size={16} color="#FFFFFF" />
                    </View>
                    <AppText variant="bodyMedium" color="#FFFFFF" style={{ flex: 1 }} numberOfLines={1}>
                      {current.bankName}
                    </AppText>
                    <View style={styles.verified}>
                      <Feather name="check" size={11} color={color.success} />
                      <AppText variant="smallMedium" color={color.success} style={{ fontSize: 11 }}>
                        Verified
                      </AppText>
                    </View>
                  </View>
                  <AppText variant="title" color="#FFFFFF" style={{ marginTop: 22, letterSpacing: 2 }}>
                    {current.accountNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')}
                  </AppText>
                  <AppText variant="small" color={color.onDarkMuted} style={{ marginTop: 4 }}>
                    {current.accountName}
                  </AppText>
                </View>
                <Button title="Change account" variant="secondary" icon="edit-2" onPress={() => (setEditing(true), setSaved(false))} style={{ marginTop: 16 }} />
                <Note />
              </>
            )}

            {editing && (
              <>
                {current && <Banner tone="info" text="Changing your account means future withdrawals go to the new account." />}
                <AppText variant="smallMedium" color={color.text} style={{ marginBottom: 6 }}>
                  Bank
                </AppText>
                <Pressable onPress={() => setPicker(true)} style={styles.pick}>
                  <Feather name="home" size={18} color={bank ? color.primary : color.subtle} style={{ marginRight: 10 }} />
                  <AppText variant="body" color={bank ? color.ink : color.subtle} style={{ flex: 1 }} numberOfLines={1}>
                    {bank?.name || 'Choose your bank'}
                  </AppText>
                  <Feather name="chevron-down" size={18} color={color.subtle} />
                </Pressable>

                <TextField
                  label="Account number"
                  icon="hash"
                  placeholder="10 digits"
                  value={number}
                  onChangeText={(v) => setNumber(v.replace(/\D/g, '').slice(0, 10))}
                  keyboardType="number-pad"
                  maxLength={10}
                  error={checkError}
                  containerStyle={{ marginBottom: 12 }}
                />

                {checking && (
                  <View style={styles.nameRow}>
                    <ActivityIndicator size="small" color={color.primary} />
                    <AppText variant="small" color={color.muted}>
                      Checking with your bank…
                    </AppText>
                  </View>
                )}
                {!!name && (
                  <View style={[styles.nameRow, styles.nameOk]}>
                    <Feather name="check-circle" size={16} color={color.success} />
                    <View style={{ flex: 1 }}>
                      <AppText variant="small" color={color.muted} style={{ fontSize: 12 }}>
                        Account name
                      </AppText>
                      <AppText variant="bodyMedium">{name}</AppText>
                    </View>
                  </View>
                )}
                <Note />
                {current && (
                  <Button title="Keep my current account" variant="ghost" onPress={() => setEditing(false)} style={{ marginTop: 8 }} />
                )}
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {editing && !loading && <BottomBar button={<Button title="Save account" icon="check" onPress={save} disabled={!name} loading={saving} />} />}

      <SearchPicker
        visible={picker}
        title="Your bank"
        options={banks.map((b) => b.name)}
        value={bank?.name ?? ''}
        onClose={() => setPicker(false)}
        onSelect={(n) => {
          setBank(banks.find((b) => b.name === n) ?? null);
          setPicker(false);
        }}
      />
    </Screen>
  );
};

const Note = () => (
  <View style={styles.note}>
    <Feather name="shield" size={14} color={color.success} />
    <AppText variant="small" color={color.text} style={{ flex: 1 }}>
      Your bank confirms the account name before we save it. Use an account in your name or your business&apos;s name.
    </AppText>
  </View>
);

const styles = themed(() => StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardAccount: { padding: 20, borderRadius: radius.xl, backgroundColor: color.navy, overflow: 'hidden' },
  glow: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: brand[600], opacity: 0.35, top: -120, right: -80 },
  bankIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, height: 22, borderRadius: 11, backgroundColor: color.successSoft },
  pick: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.md, backgroundColor: color.sunken },
  nameOk: { backgroundColor: color.successSoft },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 16, paddingHorizontal: 4 },
}));

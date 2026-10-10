// Withdraw: choose an amount, see the fee, send the request. Escardia reviews it and the server pays out.
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { auth } from '../config/supabase';
import { getWalletBalances } from '../services/walletService';
import { requestWithdrawal } from '../services/paystackService';
import { getBankAccount, getWithdrawals, BankAccount, Withdrawal, WITHDRAWAL_STATUS } from '../services/vendorService';
import { useAppSettings } from '../hooks/useAppSettings';
import { AppText, Button, Screen, ScreenHeader } from '../ui';
import { BottomBar, InfoRow, Panel } from '../ui/Booking';
import { naira } from '../ui/CarCard';
import { Pill } from '../ui/Kit';
import { color, font, gutter, radius, themed, statusBarStyle, isDark } from '../theme';

interface WithdrawFundsScreenProps {
  onNavigateBack: () => void;
  onNavigateToBankDetails: () => void;
}

const when = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });

export const WithdrawFundsScreen: React.FC<WithdrawFundsScreenProps> = ({ onNavigateBack, onNavigateToBankDetails }) => {
  const { settings } = useAppSettings();
  const [available, setAvailable] = useState(0);
  const [pending, setPending] = useState(0);
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [history, setHistory] = useState<Withdrawal[]>([]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<number | null>(null);

  const load = useCallback(async () => {
    const id = auth.currentUser?.uid;
    if (!id) return setLoading(false);
    const [w, a, h] = await Promise.all([getWalletBalances(id), getBankAccount(), getWithdrawals(10)]);
    setAvailable(w.available);
    setPending(w.pending);
    setAccount(a);
    setHistory(h);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const value = parseInt(amount, 10) || 0;
  const fee = settings.withdrawalFee;
  const problem =
    !value ? '' : value < settings.minWithdrawal ? `The minimum is ${naira(settings.minWithdrawal)}` : value > available ? 'That is more than your available balance' : value <= fee ? 'Amount must be more than the transfer fee' : '';
  const valid = !!value && !problem && !!account;

  const submit = () =>
    Alert.alert('Confirm withdrawal', `${naira(value - fee)} to ${account!.bankName}, ${account!.accountNumber} (${account!.accountName}).\n\nTransfer fee: ${naira(fee)}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Withdraw',
        onPress: async () => {
          setSending(true);
          const r = await requestWithdrawal(value);
          setSending(false);
          if (!r.success) return Alert.alert('Withdrawal not sent', r.error || 'Please try again.');
          setDone(value);
          setAmount('');
          load();
        },
      },
    ]);

  if (done !== null) {
    return (
      <Screen>
        <StatusBar style={statusBarStyle()} />
        <View style={styles.doneWrap}>
          <View style={styles.doneRing}>
            <View style={styles.doneCircle}>
              <Feather name="send" size={26} color="#FFFFFF" />
            </View>
          </View>
          <AppText variant="title" center style={{ marginTop: 20 }}>
            Withdrawal requested
          </AppText>
          <AppText variant="body" color={color.muted} center style={{ marginTop: 6 }}>
            Escardia reviews it and then sends {naira(done - fee)} to {account?.bankName}. We will notify you when it is paid.
          </AppText>
          <Button title="Done" onPress={onNavigateBack} style={{ alignSelf: 'stretch', marginTop: 28 }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <StatusBar style={statusBarStyle()} />
      <ScreenHeader title="Withdraw" subtitle={loading ? undefined : `Available ${naira(available)}`} onBack={onNavigateBack} />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={color.primary} />
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 140 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Account */}
            {account ? (
              <Pressable onPress={onNavigateToBankDetails} style={styles.account}>
                <View style={styles.accountIcon}>
                  <Feather name="home" size={16} color={color.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="small" color={color.muted}>
                    Sending to
                  </AppText>
                  <AppText variant="bodyMedium" numberOfLines={1}>
                    {account.bankName} · {account.accountNumber}
                  </AppText>
                  <AppText variant="small" color={color.muted} numberOfLines={1}>
                    {account.accountName}
                  </AppText>
                </View>
                <AppText variant="smallMedium" color={color.primary}>
                  Change
                </AppText>
              </Pressable>
            ) : (
              <Pressable onPress={onNavigateToBankDetails} style={[styles.account, styles.accountMissing]}>
                <View style={[styles.accountIcon, { backgroundColor: color.warningSoft }]}>
                  <Feather name="alert-circle" size={16} color={color.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyMedium">Add your bank account</AppText>
                  <AppText variant="small" color={color.muted}>
                    You need a verified payout account before you can withdraw.
                  </AppText>
                </View>
                <Feather name="chevron-right" size={18} color={color.subtle} />
              </Pressable>
            )}

            {/* Amount */}
            <Panel style={{ marginTop: 14, paddingVertical: 20 }}>
              <AppText variant="small" color={color.muted}>
                How much?
              </AppText>
              <View style={styles.amountRow}>
                <AppText variant="display" color={value ? color.ink : color.subtle}>
                  ₦
                </AppText>
                <TextInput
                  keyboardAppearance={isDark() ? 'dark' : 'light'}
                  value={amount ? Number(amount).toLocaleString('en-NG') : ''}
                  onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, '').slice(0, 10))}
                  placeholder="0"
                  placeholderTextColor={color.subtle}
                  keyboardType="number-pad"
                  style={styles.amountInput}
                  editable={available > 0}
                />
              </View>
              <AppText variant="small" color={problem ? color.danger : color.muted}>
                {problem || (available > 0 ? `Minimum ${naira(settings.minWithdrawal)}` : 'Nothing to withdraw yet')}
              </AppText>
              {available > 0 && (
                <View style={styles.quick}>
                  {[0.25, 0.5, 1].map((p) => {
                    const v = Math.floor(available * p);
                    return (
                      <Pressable key={p} onPress={() => setAmount(String(v))} style={[styles.quickBtn, value === v && styles.quickOn]}>
                        <AppText variant="smallMedium" color={value === v ? '#FFFFFF' : color.ink}>
                          {p === 1 ? 'All' : `${p * 100}%`}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </Panel>

            {valid && (
              <Panel style={{ marginTop: 14 }}>
                <InfoRow label="You withdraw" value={naira(value)} />
                <InfoRow label="Transfer fee" value={<AppText variant="bodyMedium" color={color.muted}>-{naira(fee)}</AppText>} />
                <View style={{ height: 1, backgroundColor: color.border, marginVertical: 4 }} />
                <InfoRow label="You receive" value={naira(value - fee)} strong />
              </Panel>
            )}

            <View style={styles.note}>
              <Feather name="info" size={14} color={color.primary} />
              <AppText variant="small" color={color.text} style={{ flex: 1 }}>
                Escardia reviews each withdrawal, then sends it to your bank. If a transfer fails, the money comes back to your balance.
                {pending > 0 ? ` ${naira(pending)} is still on hold from recent trips.` : ''}
              </AppText>
            </View>

            {/* History */}
            {history.length > 0 && (
              <>
                <AppText variant="heading" style={{ marginTop: 26, marginBottom: 12 }}>
                  Recent withdrawals
                </AppText>
                <View style={styles.list}>
                  {history.map((w, i) => {
                    const s = WITHDRAWAL_STATUS[w.status];
                    return (
                      <View key={w.id} style={[styles.row, i < history.length - 1 && styles.rowBorder]}>
                        <View style={{ flex: 1 }}>
                          <AppText variant="bodyMedium">{naira(w.amount)}</AppText>
                          <AppText variant="small" color={color.muted} numberOfLines={1}>
                            {when(w.createdAt)} · {w.bankName}
                          </AppText>
                          {!!w.failureReason && (w.status === 'failed' || w.status === 'rejected') && (
                            <AppText variant="small" color={color.danger} numberOfLines={2}>
                              {w.failureReason}
                            </AppText>
                          )}
                        </View>
                        <Pill label={s.label} tone={s.tone} />
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {!loading && (
        <BottomBar
          button={
            account ? (
              <Button title={valid ? `Withdraw ${naira(value)}` : 'Enter an amount'} icon="arrow-up-right" onPress={submit} disabled={!valid} loading={sending} />
            ) : (
              <Button title="Add bank account" icon="plus" onPress={onNavigateToBankDetails} />
            )
          }
        />
      )}
    </Screen>
  );
};

const styles = themed(() => StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  account: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.xl, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border },
  accountMissing: { borderColor: color.warningBorder, borderWidth: 1.5 },
  accountIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: color.primarySoft, alignItems: 'center', justifyContent: 'center' },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginVertical: 6 },
  amountInput: { flex: 1, minWidth: 0, width: '100%', fontFamily: font.bold, fontSize: 32, color: color.ink, paddingVertical: 0 },
  quick: { flexDirection: 'row', gap: 8, marginTop: 14 },
  quickBtn: { flex: 1, height: 40, borderRadius: radius.md, borderWidth: 1, borderColor: color.border, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' },
  quickOn: { backgroundColor: color.primary, borderColor: color.primary },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 16, paddingHorizontal: 4 },
  list: { backgroundColor: color.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: color.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: color.border },
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  doneRing: { width: 92, height: 92, borderRadius: 46, backgroundColor: color.primarySoft, alignItems: 'center', justifyContent: 'center' },
  doneCircle: { width: 66, height: 66, borderRadius: 33, backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center' },
}));

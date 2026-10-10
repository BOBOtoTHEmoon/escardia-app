import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { auth } from '../config/supabase';
import { PaystackWebView } from '../components/PaystackWebView';
import { initializeWalletFunding, verifyPayment } from '../services/paystackService';
import { getWalletBalance } from '../services/walletService';
import { AppText, Button, Screen, ScreenHeader } from '../ui';
import { BottomBar, InfoRow, Panel } from '../ui/Booking';
import { naira } from '../ui/CarCard';
import { color, font, gutter, radius, themed, statusBarStyle, isDark } from '../theme';

interface AddMoneyScreenProps {
  onNavigateBack: () => void;
  onSuccess?: () => void;
}

const QUICK = [10000, 20000, 50000, 100000, 200000, 500000];
const MIN = 100;
const MAX = 10000000;

export const AddMoneyScreen: React.FC<AddMoneyScreenProps> = ({ onNavigateBack, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState<number | null>(null);
  const [starting, setStarting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [paystack, setPaystack] = useState<{ url: string; reference: string } | null>(null);
  const [done, setDone] = useState<number | null>(null);
  const confirming = useRef(false);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (uid) getWalletBalance(uid).then(setBalance).catch(() => setBalance(0));
  }, []);

  const value = parseInt(amount, 10) || 0;
  const valid = value >= MIN && value <= MAX;

  const start = async () => {
    if (!valid) return Alert.alert('Check the amount', `Add between ${naira(MIN)} and ${naira(MAX)}.`);
    setStarting(true);
    const r = await initializeWalletFunding('', value, auth.currentUser?.uid);
    setStarting(false);
    if (!r.success || !r.authorizationUrl) return Alert.alert('Could not start payment', r.error || 'Please try again.');
    setPaystack({ url: r.authorizationUrl, reference: r.reference || '' });
  };

  const handleSuccess = async (reference: string) => {
    if (confirming.current) return;
    confirming.current = true;
    setPaystack(null);
    setVerifying(true);
    const v = await verifyPayment(reference);
    setVerifying(false);
    confirming.current = false;
    if (v.success) {
      const uid = auth.currentUser?.uid;
      const newBalance = uid ? await getWalletBalance(uid) : null;
      setBalance(newBalance);
      setDone(newBalance ?? 0);
    } else if (v.pending) {
      Alert.alert('Payment processing', v.error || 'Your wallet will be topped up as soon as your bank confirms.');
    } else {
      Alert.alert('Payment not confirmed', v.error || 'If money left your account, contact support and we will sort it out.');
    }
  };

  if (done !== null) {
    return (
      <Screen>
        <StatusBar style={statusBarStyle()} />
        <View style={styles.doneWrap}>
          <View style={styles.doneRing}>
            <View style={styles.doneCircle}>
              <Feather name="check" size={30} color="#FFFFFF" />
            </View>
          </View>
          <AppText variant="title" center style={{ marginTop: 20 }}>
            Wallet topped up
          </AppText>
          <AppText variant="body" color={color.muted} center style={{ marginTop: 6 }}>
            {naira(value)} was added. Your balance is now {naira(done)}.
          </AppText>
          <Button
            title="Done"
            onPress={() => {
              onSuccess ? onSuccess() : onNavigateBack();
            }}
            style={{ alignSelf: 'stretch', marginTop: 28 }}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <StatusBar style={statusBarStyle()} />
      <ScreenHeader title="Add money" onBack={onNavigateBack} subtitle={balance === null ? undefined : `Balance ${naira(balance)}`} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 140 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Panel style={styles.amountBox}>
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
                onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, '').slice(0, 8))}
                placeholder="0"
                placeholderTextColor={color.subtle}
                keyboardType="number-pad"
                style={styles.amountInput}
                autoFocus
              />
            </View>
            <AppText variant="small" color={value && !valid ? color.danger : color.muted}>
              {value && !valid ? `Add between ${naira(MIN)} and ${naira(MAX)}` : `From ${naira(MIN)} to ${naira(MAX)}`}
            </AppText>
          </Panel>

          <View style={styles.quick}>
            {QUICK.map((q) => (
              <Pressable key={q} onPress={() => setAmount(String(q))} style={[styles.quickBtn, value === q && styles.quickOn]}>
                <AppText variant="smallMedium" color={value === q ? '#FFFFFF' : color.ink} style={{ fontSize: 14 }}>
                  {naira(q)}
                </AppText>
              </Pressable>
            ))}
          </View>

          {valid && balance !== null && (
            <Panel style={{ marginTop: 16 }}>
              <InfoRow label="Current balance" value={naira(balance)} />
              <InfoRow label="You add" value={<AppText variant="bodyMedium" color={color.success}>+{naira(value)}</AppText>} />
              <View style={{ height: 1, backgroundColor: color.border, marginVertical: 4 }} />
              <InfoRow label="New balance" value={naira(balance + value)} strong />
            </Panel>
          )}

          <View style={styles.note}>
            <Feather name="lock" size={14} color={color.success} />
            <AppText variant="small" color={color.text} style={{ flex: 1 }}>
              Pay by card, bank transfer or USSD through Paystack. Your wallet is credited as soon as the payment clears.
            </AppText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomBar button={<Button title={valid ? `Add ${naira(value)}` : 'Enter an amount'} icon="plus" onPress={start} disabled={!valid} loading={starting} />} />

      <PaystackWebView
        visible={!!paystack}
        authorizationUrl={paystack?.url ?? ''}
        reference={paystack?.reference ?? ''}
        onSuccess={handleSuccess}
        onCancel={() => setPaystack(null)}
      />

      <Modal visible={verifying} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <ActivityIndicator color={color.primary} size="large" />
            <AppText variant="bodyMedium" style={{ marginTop: 14 }}>
              Confirming your payment…
            </AppText>
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = themed(() => StyleSheet.create({
  amountBox: { paddingVertical: 20 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginVertical: 6 },
  amountInput: { flex: 1, minWidth: 0, width: '100%', fontFamily: font.bold, fontSize: 34, color: color.ink, paddingVertical: 0 },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  quickBtn: {
    width: '31.5%',
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickOn: { backgroundColor: color.primary, borderColor: color.primary },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 16, paddingHorizontal: 4 },
  overlay: { flex: 1, backgroundColor: color.overlay, alignItems: 'center', justifyContent: 'center', padding: 32 },
  overlayCard: { width: '100%', maxWidth: 300, alignItems: 'center', padding: 24, borderRadius: radius.xl, backgroundColor: color.surface },
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  doneRing: { width: 92, height: 92, borderRadius: 46, backgroundColor: color.successSoft, alignItems: 'center', justifyContent: 'center' },
  doneCircle: { width: 66, height: 66, borderRadius: 33, backgroundColor: color.success, alignItems: 'center', justifyContent: 'center' },
}));

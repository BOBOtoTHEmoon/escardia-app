// Card and bank transfer both go through Paystack's secure page.
// This screen creates the booking, opens Paystack and confirms the payment.
import React from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { PaystackWebView } from './PaystackWebView';
import { useBookingPayment } from '../hooks/useBookingPayment';
import { AppText, Button, IconName, Screen, ScreenHeader } from '../ui';
import { BottomBar, Panel } from '../ui/Booking';
import { naira } from '../ui/CarCard';
import { brand, color, gutter, radius, themed, statusBarStyle } from '../theme';

export interface PaidBooking {
  id: string | null;
  code: string | null;
  total: number;
}

const COPY: Record<'card' | 'bank', { title: string; icon: IconName; steps: string[]; note: string }> = {
  card: {
    title: 'Pay by card',
    icon: 'credit-card',
    steps: ['Tap Pay below to open Paystack', 'Enter your card details', 'Approve with the OTP from your bank'],
    note: 'Visa, Mastercard and Verve cards from any Nigerian bank.',
  },
  bank: {
    title: 'Pay by bank transfer',
    icon: 'briefcase',
    steps: ['Tap Pay below to open Paystack', 'Choose Bank Transfer or USSD', 'Send the exact amount shown. It confirms in seconds.'],
    note: 'Works with GTBank, Access, Zenith, First Bank, UBA, Kuda, OPay and every other Nigerian bank.',
  },
};

export const PaystackCheckout = ({
  method,
  quotedAmount,
  bookingData,
  onNavigateBack,
  onPaid,
}: {
  method: 'card' | 'bank';
  quotedAmount: number;
  bookingData: any;
  onNavigateBack: () => void;
  onPaid: (result: PaidBooking) => void;
}) => {
  const pay = useBookingPayment(bookingData);
  const total = pay.serverTotal ?? quotedAmount;
  const copy = COPY[method];
  const t = bookingData?.tripData;

  const start = async () => {
    if (!t) return Alert.alert('Something went wrong', 'Your trip details are missing. Please start the booking again.');
    const result = await pay.startPaystack();
    if (!result.ok) Alert.alert('Could not start payment', result.error || 'Please try again.');
  };

  const handleSuccess = async (reference: string) => {
    const result = await pay.confirmPaystack(reference);
    if (result.ignored) return;
    if (result.ok) onPaid(pay.paidBooking());
    else if (result.pending)
      Alert.alert('Payment processing', result.error || 'Your bank is still confirming the payment. Check My Trips in a minute.');
    else Alert.alert('Payment not confirmed', result.error || 'If money left your account, contact support and we will sort it out.');
  };

  const handleCancel = async () => {
    await pay.cancelPaystack();
  };

  const stageText =
    pay.stage === 'creating' ? 'Reserving the car…' : pay.stage === 'initializing' ? 'Opening Paystack…' : pay.stage === 'verifying' ? 'Confirming your payment…' : '';

  return (
    <Screen>
      <StatusBar style={statusBarStyle()} />
      <ScreenHeader title={copy.title} onBack={onNavigateBack} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <View style={styles.amount}>
          <View style={styles.glow} />
          <AppText variant="small" color={color.onDarkMuted}>
            Amount to pay
          </AppText>
          <AppText variant="display" color="#FFFFFF" style={{ marginTop: 4 }}>
            {naira(total)}
          </AppText>
          {t && (
            <AppText variant="small" color={color.onDarkMuted} style={{ marginTop: 6 }}>
              {t.car.brand} {t.car.model} · {t.startDate}
            </AppText>
          )}
        </View>

        <Panel style={{ marginTop: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <View style={styles.icon}>
              <Feather name={copy.icon} size={16} color={color.primary} />
            </View>
            <AppText variant="subheading">How it works</AppText>
          </View>
          {copy.steps.map((s, i) => (
            <View key={s} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <AppText variant="smallMedium" color={color.primary} style={{ fontSize: 12 }}>
                  {i + 1}
                </AppText>
              </View>
              <AppText variant="body" color={color.text} style={{ flex: 1 }}>
                {s}
              </AppText>
            </View>
          ))}
          <AppText variant="small" color={color.muted} style={{ marginTop: 8 }}>
            {copy.note}
          </AppText>
        </Panel>

        <View style={styles.secure}>
          <Feather name="lock" size={14} color={color.success} />
          <AppText variant="small" color={color.text} style={{ flex: 1 }}>
            Payments are handled by Paystack. Escardia never sees your card or bank details.
          </AppText>
        </View>
        <View style={styles.secure}>
          <Feather name="clock" size={14} color={color.muted} />
          <AppText variant="small" color={color.text} style={{ flex: 1 }}>
            We hold the car for you while you pay. If you close Paystack, the car is released.
          </AppText>
        </View>
      </ScrollView>

      <BottomBar button={<Button title={`Pay ${naira(total)}`} icon="lock" onPress={start} loading={pay.loading} />} />

      <PaystackWebView visible={pay.showPaystack} authorizationUrl={pay.authorizationUrl} reference={pay.reference} onSuccess={handleSuccess} onCancel={handleCancel} />

      <Modal visible={pay.stage === 'verifying'} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <ActivityIndicator color={color.primary} size="large" />
            <AppText variant="bodyMedium" style={{ marginTop: 14 }}>
              {stageText}
            </AppText>
            <AppText variant="small" color={color.muted} center style={{ marginTop: 4 }}>
              Please keep the app open.
            </AppText>
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = themed(() => StyleSheet.create({
  amount: { padding: 22, borderRadius: radius.xl, backgroundColor: color.navy, overflow: 'hidden' },
  glow: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: brand[600], opacity: 0.35, right: -80, top: -110 },
  icon: { width: 34, height: 34, borderRadius: 10, backgroundColor: color.primarySoft, alignItems: 'center', justifyContent: 'center' },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: color.primarySoft, alignItems: 'center', justifyContent: 'center' },
  secure: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 14, paddingHorizontal: 4 },
  overlay: { flex: 1, backgroundColor: color.overlay, alignItems: 'center', justifyContent: 'center', padding: 32 },
  overlayCard: { width: '100%', maxWidth: 300, alignItems: 'center', padding: 24, borderRadius: radius.xl, backgroundColor: color.surface },
}));

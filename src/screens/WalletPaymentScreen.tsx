import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { auth } from '../config/supabase';
import { getWalletBalance } from '../services/walletService';
import { useBookingPayment } from '../hooks/useBookingPayment';
import type { PaidBooking } from '../components/PaystackCheckout';
import { AppText, Banner, Button, Screen, ScreenHeader } from '../ui';
import { BottomBar, InfoRow, Panel } from '../ui/Booking';
import { naira } from '../ui/CarCard';
import { brand, color, gutter, radius, themed, statusBarStyle } from '../theme';

interface WalletPaymentScreenProps {
  onNavigateBack: () => void;
  onPaymentComplete: (paymentMethod: string, result?: PaidBooking) => void;
  totalAmount: number;
  bookingData?: any;
}

export const WalletPaymentScreen: React.FC<WalletPaymentScreenProps> = ({ onNavigateBack, onPaymentComplete, totalAmount, bookingData }) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const pay = useBookingPayment(bookingData);

  const loadBalance = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return setBalance(0);
    try {
      setBalance(await getWalletBalance(uid));
    } catch {
      setBalance(0);
    }
  };

  useEffect(() => {
    loadBalance();
  }, []);

  const total = pay.serverTotal ?? totalAmount;
  const enough = balance !== null && balance >= total;
  const t = bookingData?.tripData;

  const confirmPay = () => {
    if (!t) return Alert.alert('Something went wrong', 'Your trip details are missing. Please start the booking again.');
    Alert.alert('Pay from wallet?', `${naira(total)} will be taken from your Escardia wallet.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Pay now', onPress: payNow },
    ]);
  };

  const payNow = async () => {
    setProcessing(true);
    const result = await pay.payWithWallet();
    setProcessing(false);
    if (!result.ok) {
      Alert.alert('Payment failed', result.error || 'Something went wrong. Please try again.');
      loadBalance();
      return;
    }
    onPaymentComplete('wallet', pay.paidBooking());
  };

  return (
    <Screen>
      <StatusBar style={statusBarStyle()} />
      <ScreenHeader title="Pay from wallet" onBack={onNavigateBack} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.glow} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name="pocket" size={16} color={brand[200]} />
            <AppText variant="small" color={color.onDarkMuted}>
              Escardia wallet
            </AppText>
          </View>
          {balance === null ? (
            <ActivityIndicator color="#FFFFFF" style={{ alignSelf: 'flex-start', marginTop: 14 }} />
          ) : (
            <AppText variant="display" color="#FFFFFF" style={{ marginTop: 8 }}>
              {naira(balance)}
            </AppText>
          )}
          <AppText variant="small" color={color.onDarkMuted} style={{ marginTop: 4 }}>
            Available balance
          </AppText>
        </View>

        {balance !== null && !enough && (
          <View style={{ marginTop: 16 }}>
            <Banner text={`You need ${naira(total - balance)} more. Pay by card or bank transfer instead, or top up your wallet from your profile.`} />
          </View>
        )}

        <Panel style={{ marginTop: 16 }}>
          {t && <InfoRow label="Trip" value={`${t.car.brand} ${t.car.model}`} />}
          {t && <InfoRow label="Pick-up" value={`${t.startDate}, ${t.startTime}`} />}
          <View style={styles.divider} />
          <InfoRow label="To pay" value={naira(total)} strong />
          {balance !== null && enough && <InfoRow label="Balance after" value={naira(balance - total)} />}
        </Panel>

        <View style={styles.note}>
          <Feather name="zap" size={14} color={color.primary} />
          <AppText variant="small" color={color.text} style={{ flex: 1 }}>
            Wallet payments confirm instantly. No card or bank app needed.
          </AppText>
        </View>
      </ScrollView>

      <BottomBar
        button={
          enough ? (
            <Button title={`Pay ${naira(total)}`} icon="lock" onPress={confirmPay} loading={processing} />
          ) : (
            <Button title="Choose another way to pay" variant="secondary" onPress={onNavigateBack} />
          )
        }
      />

      <Modal visible={processing} transparent animationType="fade">
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
  card: { padding: 22, borderRadius: radius.xl, backgroundColor: color.navy, overflow: 'hidden' },
  glow: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: brand[600], opacity: 0.35, right: -80, top: -110 },
  divider: { height: 1, backgroundColor: color.border, marginVertical: 4 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 14, paddingHorizontal: 4 },
  overlay: { flex: 1, backgroundColor: color.overlay, alignItems: 'center', justifyContent: 'center', padding: 32 },
  overlayCard: { width: '100%', maxWidth: 300, alignItems: 'center', padding: 24, borderRadius: radius.xl, backgroundColor: color.surface },
}));

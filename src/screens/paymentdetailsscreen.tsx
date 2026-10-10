import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { auth } from '../config/supabase';
import { calculateTripPrice, getServerTripPrice } from '../services/pricingservice';
import { getWalletBalance } from '../services/walletService';
import { AppText, Button, Screen, ScreenHeader } from '../ui';
import { BookingSteps, BottomBar, InfoRow, OptionCard, Panel, SectionTitle } from '../ui/Booking';
import { naira } from '../ui/CarCard';
import { color, gutter, radius, themed, statusBarStyle } from '../theme';

type Method = 'card' | 'bank' | 'wallet';

interface PaymentDetailsScreenProps {
  onNavigateBack: () => void;
  onNavigateToCardPayment: (totalAmount: number) => void;
  onNavigateToBankTransfer: (totalAmount: number) => void;
  onNavigateToWalletPayment: (totalAmount: number) => void;
  bookingData: any;
}

const PaymentDetailsScreen: React.FC<PaymentDetailsScreenProps> = ({
  onNavigateBack,
  onNavigateToCardPayment,
  onNavigateToBankTransfer,
  onNavigateToWalletPayment,
  bookingData,
}) => {
  const [method, setMethod] = useState<Method>('card');
  const [pricing, setPricing] = useState<any>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const t = bookingData?.tripData;
    if (!t?.car) return;
    // Quick estimate first, then the real price from the server.
    setPricing(
      calculateTripPrice({
        car: { pricePerDay: t.car.pricePerDay, pricePerHour: t.car.pricePerHour },
        tripDetails: { durationType: t.durationType, duration: t.duration, pickupMethod: t.pickupMethod, rideMode: t.rideMode },
        escorts: bookingData.escortData?.escorts || null,
        hiluxCount: bookingData.escortData?.hiluxCount || 0,
        hiluxCost: bookingData.escortData?.hiluxCost || 0,
      })
    );
    getServerTripPrice(bookingData)
      .then((p) => {
        setPricing(p);
        setConfirmed(true);
      })
      .catch(() => setConfirmed(false));

    const uid = auth.currentUser?.uid;
    if (uid) getWalletBalance(uid).then(setBalance).catch(() => setBalance(null));
  }, [bookingData]);

  const t = bookingData?.tripData;
  if (!t || !pricing) {
    return (
      <Screen>
        <ScreenHeader title="Review and pay" onBack={onNavigateBack} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={color.primary} />
        </View>
      </Screen>
    );
  }

  const total: number = pricing.total;
  const walletShort = balance !== null && balance < total;
  const escorts: { type: string; count: number }[] = bookingData.escortData?.escorts ?? [];
  const hilux = bookingData.escortData?.hiluxCount ?? 0;
  const security = [...escorts.map((e) => `${e.count} ${e.type.toUpperCase()}`), hilux ? `${hilux} Hilux` : null].filter(Boolean).join(', ');

  const proceed = () => {
    if (method === 'card') onNavigateToCardPayment(total);
    else if (method === 'bank') onNavigateToBankTransfer(total);
    else onNavigateToWalletPayment(total);
  };

  return (
    <Screen>
      <StatusBar style={statusBarStyle()} />
      <ScreenHeader title="Review and pay" onBack={onNavigateBack} />
      <BookingSteps current={3} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
        {/* Trip */}
        <Panel style={{ padding: 0, overflow: 'hidden' }}>
          <View style={styles.tripTop}>
            {t.car.photos?.[0] ? (
              <Image source={{ uri: t.car.photos[0] }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, { alignItems: 'center', justifyContent: 'center' }]}>
                <Feather name="image" size={18} color={color.subtle} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <AppText variant="subheading" numberOfLines={1}>
                {t.car.brand} {t.car.model}
              </AppText>
              <AppText variant="small" color={color.muted}>
                {t.duration} {t.durationType}
                {t.duration > 1 ? 's' : ''} · With driver
              </AppText>
            </View>
          </View>
          <View style={styles.timeline}>
            <TimePoint label="Pick-up" date={t.startDate} time={t.startTime} />
            <Feather name="arrow-right" size={16} color={color.subtle} />
            <TimePoint label="Return" date={t.endDate} time={t.stopTime} right />
          </View>
          <View style={{ paddingHorizontal: 16, paddingBottom: 6 }}>
            <InfoRow icon={t.pickupMethod === 'delivery' ? 'truck' : 'map-pin'} label={t.pickupMethod === 'delivery' ? 'Delivery' : 'Pick-up'} value={t.pickupLocation} />
            <InfoRow icon="shield" label="Security" value={security || 'None'} />
          </View>
        </Panel>

        {/* Price */}
        <SectionTitle title="Price" />
        <Panel>
          {pricing.breakdown.map((row: { label: string; amount: number }) => (
            <InfoRow key={row.label} label={row.label} value={naira(row.amount)} />
          ))}
          <View style={styles.divider} />
          <InfoRow label="Total" value={naira(total)} strong />
          <View style={styles.priceNote}>
            <Feather name={confirmed ? 'check-circle' : 'info'} size={13} color={confirmed ? color.success : color.muted} />
            <AppText variant="small" color={confirmed ? color.success : color.muted}>
              {confirmed ? 'Price confirmed by Escardia' : 'Estimate. The final price is confirmed when you pay.'}
            </AppText>
          </View>
        </Panel>

        {/* Method */}
        <SectionTitle title="Pay with" />
        <OptionCard icon="credit-card" title="Card" subtitle="Visa, Mastercard or Verve" selected={method === 'card'} onPress={() => setMethod('card')} />
        <OptionCard icon="briefcase" title="Bank transfer" subtitle="Pay from your bank app or with USSD" selected={method === 'bank'} onPress={() => setMethod('bank')} />
        <OptionCard
          icon="pocket"
          title="Escardia wallet"
          subtitle={balance === null ? 'Loading balance…' : walletShort ? `Balance ${naira(balance)} · not enough for this trip` : `Balance ${naira(balance)}`}
          selected={method === 'wallet'}
          onPress={() => setMethod('wallet')}
        />

        {/* Policy */}
        <View style={styles.policy}>
          <Feather name="rotate-ccw" size={16} color={color.primary} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <AppText variant="smallMedium">Cancellation</AppText>
            <AppText variant="small" color={color.text} style={{ marginTop: 2 }}>
              Full refund up to 24 hours before pick-up. 50% back from 12 to 24 hours before, 25% from 2 to 12 hours before, and nothing in the last 2 hours. Refunds go to your Escardia wallet.
            </AppText>
          </View>
        </View>
      </ScrollView>

      <BottomBar
        label="Total"
        amount={naira(total)}
        button={<Button title={method === 'wallet' ? 'Pay from wallet' : 'Continue to pay'} iconRight="lock" onPress={proceed} />}
      />
    </Screen>
  );
};

const TimePoint = ({ label, date, time, right }: { label: string; date: string; time: string; right?: boolean }) => (
  <View style={{ flex: 1, alignItems: right ? 'flex-end' : 'flex-start' }}>
    <AppText variant="small" color={color.muted} style={{ fontSize: 12 }}>
      {label}
    </AppText>
    <AppText variant="bodyMedium">{date}</AppText>
    <AppText variant="small" color={color.text}>
      {time}
    </AppText>
  </View>
);

const styles = themed(() => StyleSheet.create({
  tripTop: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: color.border },
  photo: { width: 64, height: 48, borderRadius: 10, backgroundColor: color.sunken },
  timeline: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: color.highlight, borderBottomWidth: 1, borderBottomColor: color.border },
  divider: { height: 1, backgroundColor: color.border, marginVertical: 4 },
  priceNote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  policy: { flexDirection: 'row', gap: 12, marginTop: 14, padding: 14, borderRadius: radius.lg, backgroundColor: color.primarySoft },
}));

export default PaymentDetailsScreen;

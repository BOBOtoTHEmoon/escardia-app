import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Linking, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button } from '../ui';
import { InfoRow, Panel, SectionTitle } from '../ui/Booking';
import { naira } from '../ui/CarCard';
import { brand, color, gutter, radius, themed } from '../theme';

interface BookingConfirmationScreenProps {
  onBackToHome: () => void;
  onViewTrips?: () => void;
  bookingData: any;
  totalAmount: number;
  paymentMethod: string;
}

const METHOD: Record<string, string> = { card: 'Card', bank: 'Bank transfer', wallet: 'Escardia wallet' };

export const BookingConfirmationScreen: React.FC<BookingConfirmationScreenProps> = ({ onBackToHome, onViewTrips, bookingData, totalAmount, paymentMethod }) => {
  const insets = useSafeAreaInsets();
  const [vendor, setVendor] = useState<{ businessName?: string; phoneNumber?: string } | null>(null);
  const pop = useRef(new Animated.Value(0)).current;

  const t = bookingData?.tripData;
  const code: string = bookingData?.bookingCode || '';

  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
    const vendorId = t?.car?.vendorId;
    if (vendorId) {
      import('../services/vendorauthservice')
        .then(({ getPublicVendorDetails }) => getPublicVendorDetails(vendorId))
        .then(setVendor)
        .catch(() => setVendor(null));
    }
  }, [pop, t?.car?.vendorId]);

  if (!t) return null;

  const escorts: { type: string; count: number }[] = bookingData.escortData?.escorts ?? [];
  const hilux = bookingData.escortData?.hiluxCount ?? 0;
  const security = [...escorts.map((e) => `${e.count} ${e.type.toUpperCase()}`), hilux ? `${hilux} Hilux` : null].filter(Boolean).join(', ');

  const share = () =>
    Share.share({
      message: `My Escardia trip${code ? ` ${code}` : ''}: ${t.car.brand} ${t.car.model}, ${t.startDate} ${t.startTime} to ${t.endDate} ${t.stopTime}.`,
    }).catch(() => {});

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 140 }} showsVerticalScrollIndicator={false} bounces={false}>
        {/* Success */}
        <View style={[styles.hero, { paddingTop: insets.top + 32 }]}>
          <View style={styles.glow} />
          <Animated.View style={[styles.checkRing, { transform: [{ scale: pop }] }]}>
            <View style={styles.check}>
              <Feather name="check" size={34} color="#FFFFFF" />
            </View>
          </Animated.View>
          <AppText variant="title" color="#FFFFFF" center style={{ marginTop: 20 }}>
            You&apos;re booked
          </AppText>
          <AppText variant="body" color={color.onDarkMuted} center style={{ marginTop: 6, paddingHorizontal: 32 }}>
            {naira(totalAmount)} paid. Your car and driver are confirmed.
          </AppText>
          {!!code && (
            <Pressable onPress={share} style={styles.code}>
              <AppText variant="caption" color={color.onDarkMuted}>
                Trip ID
              </AppText>
              <AppText variant="subheading" color="#FFFFFF" style={{ letterSpacing: 1 }}>
                {code}
              </AppText>
              <Feather name="share-2" size={14} color={brand[200]} />
            </Pressable>
          )}
        </View>

        <View style={{ paddingHorizontal: gutter, marginTop: -28 }}>
          {/* Trip */}
          <Panel style={{ padding: 0, overflow: 'hidden' }}>
            {t.car.photos?.[0] && <Image source={{ uri: t.car.photos[0] }} style={styles.photo} />}
            <View style={{ padding: 16 }}>
              <AppText variant="heading">
                {t.car.brand} {t.car.model}
              </AppText>
              <AppText variant="small" color={color.muted}>
                {t.car.year} · {t.duration} {t.durationType}
                {t.duration > 1 ? 's' : ''} with driver
              </AppText>
              <View style={styles.timeline}>
                <View style={{ flex: 1 }}>
                  <AppText variant="small" color={color.muted} style={{ fontSize: 12 }}>
                    Pick-up
                  </AppText>
                  <AppText variant="bodyMedium">{t.startDate}</AppText>
                  <AppText variant="small">{t.startTime}</AppText>
                </View>
                <Feather name="arrow-right" size={16} color={color.subtle} />
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <AppText variant="small" color={color.muted} style={{ fontSize: 12 }}>
                    Return
                  </AppText>
                  <AppText variant="bodyMedium">{t.endDate}</AppText>
                  <AppText variant="small">{t.stopTime}</AppText>
                </View>
              </View>
              <InfoRow icon={t.pickupMethod === 'delivery' ? 'truck' : 'map-pin'} label={t.pickupMethod === 'delivery' ? 'Delivery to' : 'Meet at'} value={t.pickupLocation} />
              <InfoRow icon="shield" label="Security" value={security || 'None'} />
              <InfoRow icon="credit-card" label="Paid with" value={METHOD[paymentMethod] ?? paymentMethod} />
            </View>
          </Panel>

          {/* Vendor */}
          <SectionTitle title="Your vendor" />
          <Panel style={styles.vendor}>
            <View style={styles.vendorAvatar}>
              <AppText variant="subheading" color={color.primary}>
                {(vendor?.businessName?.[0] ?? t.car.vendorName?.[0] ?? 'E').toUpperCase()}
              </AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyMedium" numberOfLines={1}>
                {vendor?.businessName || t.car.vendorName || 'Your vendor'}
              </AppText>
              <AppText variant="small" color={color.muted}>
                {vendor?.phoneNumber || 'Contact details will show here shortly'}
              </AppText>
            </View>
            {!!vendor?.phoneNumber && (
              <Pressable onPress={() => Linking.openURL(`tel:${vendor.phoneNumber}`)} style={styles.call} accessibilityLabel="Call vendor">
                <Feather name="phone" size={16} color="#FFFFFF" />
              </Pressable>
            )}
          </Panel>

          {/* Next */}
          <SectionTitle title="What happens next" />
          <Panel>
            {[
              { icon: 'bell' as const, text: 'Your trip is in My Trips. We will notify you as it starts and ends.' },
              {
                icon: t.pickupMethod === 'delivery' ? ('truck' as const) : ('map-pin' as const),
                text: t.pickupMethod === 'delivery' ? 'Your driver brings the car to your address at pick-up time.' : 'Meet your driver at the vendor location at pick-up time.',
              },
              { icon: 'alert-circle' as const, text: 'Something wrong during or after the trip? Report it from My Trips within 24 hours.' },
            ].map((s, i) => (
              <View key={i} style={styles.next}>
                <View style={styles.nextIcon}>
                  <Feather name={s.icon} size={14} color={color.primary} />
                </View>
                <AppText variant="body" color={color.text} style={{ flex: 1 }}>
                  {s.text}
                </AppText>
              </View>
            ))}
          </Panel>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {onViewTrips && <Button title="View my trips" onPress={onViewTrips} style={{ flex: 1 }} />}
        <Button title="Back to home" variant="secondary" onPress={onBackToHome} style={{ flex: 1 }} />
      </View>
    </View>
  );
};

const styles = themed(() => StyleSheet.create({
  hero: { backgroundColor: color.navy, alignItems: 'center', paddingBottom: 60, overflow: 'hidden' },
  glow: { position: 'absolute', width: 360, height: 360, borderRadius: 180, backgroundColor: brand[600], opacity: 0.28, top: -160 },
  checkRing: { width: 92, height: 92, borderRadius: 46, backgroundColor: 'rgba(16,185,129,0.18)', alignItems: 'center', justifyContent: 'center' },
  check: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  code: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  photo: { width: '100%', height: 160, backgroundColor: color.sunken },
  timeline: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, marginBottom: 6, padding: 12, borderRadius: radius.md, backgroundColor: color.sunken },
  vendor: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  vendorAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: color.primarySoft, alignItems: 'center', justifyContent: 'center' },
  call: { width: 40, height: 40, borderRadius: 20, backgroundColor: color.success, alignItems: 'center', justifyContent: 'center' },
  next: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 8 },
  nextIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: color.primarySoft, alignItems: 'center', justifyContent: 'center' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: gutter,
    paddingTop: 14,
    backgroundColor: color.surface,
    borderTopWidth: 1,
    borderTopColor: color.border,
  },
}));

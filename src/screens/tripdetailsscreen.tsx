import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../config/supabase';
import { Booking, cancelBooking, getBooking, reportProblem } from '../services/bookingService';
import ratingService from '../services/ratingservice';
import RatingModal from '../components/ratingmodal';
import { TripMap } from '../components/TripMap';
import { AppText, Banner, Button, IconButton, Screen, ScreenHeader } from '../ui';
import { InfoRow, Panel, SectionTitle } from '../ui/Booking';
import { naira } from '../ui/CarCard';
import { StatusPill, relativeTime } from '../ui/Status';
import { color, font, gutter, radius, themed, statusBarStyle, isDark } from '../theme';

interface TripDetailScreenProps {
  tripData: Booking;
  onNavigateBack: () => void;
  onEditTrip?: () => void;
}

const PAID_WITH: Record<string, string> = { wallet: 'Escardia wallet', card: 'Card', bank: 'Bank transfer', bank_transfer: 'Bank transfer', ussd: 'USSD' };

const REASONS = ['The car was not as described', 'Problem with the driver', 'The car was late or did not come', 'Security did not show up', 'Something else'];

/** Same tiers as the database: 24h+ full, 12h+ half, 2h+ quarter, else nothing. */
const refundPercent = (startAt: string) => {
  const h = (new Date(startAt).getTime() - Date.now()) / 3600000;
  return h >= 24 ? 100 : h >= 12 ? 50 : h >= 2 ? 25 : 0;
};

export const TripDetailScreen: React.FC<TripDetailScreenProps> = ({ tripData, onNavigateBack }) => {
  const insets = useSafeAreaInsets();
  const [trip, setTrip] = useState<Booking>(tripData);
  const [busy, setBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);

  const reload = useCallback(async () => {
    const res = await getBooking(tripData.id);
    if (res.success && res.booking) setTrip(res.booking);
  }, [tripData.id]);

  useEffect(() => {
    reload();
  }, [reload]);

  const s = trip.bookingStatus;
  const reportWindowOpen = s === 'ongoing' || (s === 'completed' && !trip.releasedAt && !!trip.releaseAt && new Date(trip.releaseAt) > new Date());
  const canRate = s === 'completed' && !trip.rated;
  const security = [...(trip.escort ?? []).map((e: any) => `${e.count} ${String(e.type).toUpperCase()}`), trip.hiluxCount ? `${trip.hiluxCount} Hilux` : null]
    .filter(Boolean)
    .join(', ');
  const vendorPhone = trip.car.vendorPhone;
  const driver = trip.driver as { name?: string; phone?: string; photo_url?: string } | null;

  const headline =
    s === 'confirmed'
      ? relativeTime(trip.startAt, 'Starts in') || 'Starting soon'
      : s === 'ongoing'
        ? relativeTime(trip.endAt, 'Ends in') || 'Ending soon'
        : s === 'disputed'
          ? 'Escardia is reviewing your report'
          : s === 'cancelled'
            ? 'This trip was cancelled'
            : 'Trip finished';

  const confirmCancel = () => {
    const pct = refundPercent(trip.startAt);
    const amount = Math.round((trip.totalPrice * pct) / 100);
    Alert.alert(
      'Cancel this trip?',
      pct > 0
        ? `You will get ${pct}% back (${naira(amount)}) in your Escardia wallet.`
        : 'The trip starts in less than 2 hours, so there is no refund.',
      [
        { text: 'Keep trip', style: 'cancel' },
        {
          text: 'Cancel trip',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            const r = await cancelBooking(trip.id, 'Cancelled by customer');
            setBusy(false);
            if (!r.success) return Alert.alert('Could not cancel', r.error || 'Please try again.');
            Alert.alert('Trip cancelled', r.refundAmount ? `${naira(r.refundAmount)} has been added to your wallet.` : 'Your trip has been cancelled.');
            reload();
          },
        },
      ]
    );
  };

  const submitReport = async (reason: string) => {
    setBusy(true);
    const r = await reportProblem(trip.id, reason);
    setBusy(false);
    setReportOpen(false);
    if (!r.success) return Alert.alert('Could not send', r.error || 'Please try again.');
    Alert.alert('Report sent', 'Thanks for telling us. Escardia will contact you shortly and the vendor will not be paid until we have looked into it.');
    reload();
  };

  const submitRating = async (data: any) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await ratingService.submitRating(trip.id, trip.carId, user.uid, '', data);
      setRateOpen(false);
      Alert.alert('Thank you', 'Your rating helps other riders choose well.');
      reload();
    } catch (e: any) {
      Alert.alert('Could not save rating', e?.message || 'Please try again.');
    }
  };

  const footer =
    s === 'confirmed' ? (
      <Button title="Cancel trip" variant="secondary" icon="x-circle" onPress={confirmCancel} loading={busy} style={{ flex: 1 }} />
    ) : reportWindowOpen ? (
      <Button title="Report a problem" variant="secondary" icon="alert-triangle" onPress={() => setReportOpen(true)} style={{ flex: 1 }} />
    ) : canRate ? (
      <Button title="Rate this trip" icon="star" onPress={() => setRateOpen(true)} style={{ flex: 1 }} />
    ) : null;

  return (
    <Screen>
      <StatusBar style={statusBarStyle()} />
      <ScreenHeader title={trip.code ? `Trip ${trip.code}` : 'Trip details'} onBack={onNavigateBack} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: footer ? 130 : insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
        {/* Car and status */}
        <Panel style={{ padding: 0, overflow: 'hidden' }}>
          {trip.car.photos?.[0] && <Image source={{ uri: trip.car.photos[0] }} style={styles.photo} />}
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <AppText variant="heading">
                  {trip.car.brand} {trip.car.model}
                </AppText>
                <AppText variant="small" color={color.muted}>
                  {trip.car.year} · {trip.duration} {trip.durationType}
                  {trip.duration > 1 ? 's' : ''} with driver
                </AppText>
              </View>
              <StatusPill status={s} />
            </View>
            <AppText variant="smallMedium" color={s === 'disputed' ? color.danger : color.primary} style={{ marginTop: 10 }}>
              {headline}
            </AppText>
            <View style={styles.timeline}>
              <View style={{ flex: 1 }}>
                <AppText variant="small" color={color.muted} style={{ fontSize: 12 }}>
                  Pick-up
                </AppText>
                <AppText variant="bodyMedium">{trip.startDate}</AppText>
                <AppText variant="small">{trip.startTime}</AppText>
              </View>
              <Feather name="arrow-right" size={16} color={color.subtle} />
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <AppText variant="small" color={color.muted} style={{ fontSize: 12 }}>
                  Return
                </AppText>
                <AppText variant="bodyMedium">{trip.endDate}</AppText>
                <AppText variant="small">{trip.stopTime}</AppText>
              </View>
            </View>
          </View>
        </Panel>

        {s === 'disputed' && !!trip.disputeReason && (
          <View style={{ marginTop: 14 }}>
            <Banner text={`You reported: ${trip.disputeReason}`} />
          </View>
        )}
        {s === 'cancelled' && trip.refundAmount > 0 && (
          <View style={{ marginTop: 14 }}>
            <Banner tone="success" text={`${naira(trip.refundAmount)} was refunded to your Escardia wallet.`} />
          </View>
        )}

        {/* Where */}
        <SectionTitle title={trip.pickupMethod === 'delivery' ? 'Delivery address' : 'Where to meet'} />
        <Panel style={{ padding: 0, overflow: 'hidden' }}>
          <TripMap address={trip.pickupLocation || trip.car.location || 'Lagos'} label={trip.pickupMethod === 'delivery' ? 'Delivery' : 'Pick-up'} height={210} />
          <View style={styles.place}>
            <Feather name={trip.pickupMethod === 'delivery' ? 'truck' : 'map-pin'} size={16} color={color.primary} />
            <AppText variant="bodyMedium" style={{ flex: 1 }}>
              {trip.pickupLocation || trip.car.location || 'The vendor will share the address'}
            </AppText>
          </View>
        </Panel>

        {/* People */}
        <SectionTitle title="Your team" />
        <Panel style={{ paddingVertical: 4 }}>
          <Person
            label="Driver"
            name={driver?.name || 'Being assigned'}
            sub={driver?.name ? driver.phone : 'The vendor assigns your driver before the trip.'}
            phone={driver?.phone}
            photo={driver?.photo_url}
          />
          <View style={styles.divider} />
          <Person label="Vendor" name={trip.car.vendorName || 'Escardia vendor'} sub={vendorPhone} phone={vendorPhone} />
        </Panel>

        {/* Details */}
        <SectionTitle title="Payment" />
        <Panel>
          <InfoRow label={`Car rental (${trip.duration} ${trip.durationType}${trip.duration > 1 ? 's' : ''})`} value={naira(trip.baseRental)} />
          {trip.deliveryFee > 0 && <InfoRow label="Delivery" value={naira(trip.deliveryFee)} />}
          {trip.escortFee > 0 && <InfoRow label="Security" value={naira(trip.escortFee)} />}
          {trip.hiluxFee > 0 && <InfoRow label="Hilux" value={naira(trip.hiluxFee)} />}
          <InfoRow label="Service fee" value={naira(trip.serviceFee)} />
          <View style={styles.divider} />
          <InfoRow label="Total paid" value={naira(trip.totalPrice)} strong />
          <InfoRow icon="shield" label="Security" value={security || 'None'} />
          <InfoRow icon="credit-card" label="Paid with" value={PAID_WITH[trip.paymentMethod ?? ''] ?? 'Paystack'} />
        </Panel>

        {s === 'confirmed' && (
          <AppText variant="small" color={color.muted} style={{ marginTop: 12, paddingHorizontal: 4 }}>
            Need to change the time or car? Cancel and book again, or contact support from your profile. Cancelling now gives you {refundPercent(trip.startAt)}% back.
          </AppText>
        )}
        {reportWindowOpen && canRate && (
          <Pressable onPress={() => setRateOpen(true)} style={{ marginTop: 14, alignSelf: 'center' }}>
            <AppText variant="smallMedium" color={color.primary}>
              Rate this trip
            </AppText>
          </Pressable>
        )}
      </ScrollView>

      {footer && <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>{footer}</View>}

      <ReportSheet visible={reportOpen} busy={busy} onClose={() => setReportOpen(false)} onSubmit={submitReport} />
      <RatingModal visible={rateOpen} onClose={() => setRateOpen(false)} onSubmit={submitRating} tripData={{ carName: `${trip.car.brand} ${trip.car.model}`, hadDriver: true }} />
    </Screen>
  );
};

const Person = ({ label, name, sub, phone, photo }: { label: string; name: string; sub?: string; phone?: string; photo?: string }) => (
  <View style={styles.person}>
    {photo ? (
      <Image source={{ uri: photo }} style={styles.avatar} />
    ) : (
      <View style={styles.avatar}>
        <Feather name={label === 'Driver' ? 'user' : 'briefcase'} size={18} color={color.primary} />
      </View>
    )}
    <View style={{ flex: 1 }}>
      <AppText variant="small" color={color.muted} style={{ fontSize: 12 }}>
        {label}
      </AppText>
      <AppText variant="bodyMedium" numberOfLines={1}>
        {name}
      </AppText>
      {!!sub && (
        <AppText variant="small" color={color.muted} numberOfLines={2}>
          {sub}
        </AppText>
      )}
    </View>
    {!!phone && (
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <IconButton icon="message-square" size={38} onPress={() => Linking.openURL(`sms:${phone}`)} accessibilityLabel={`Text ${label.toLowerCase()}`} />
        <Pressable onPress={() => Linking.openURL(`tel:${phone}`)} style={styles.call} accessibilityLabel={`Call ${label.toLowerCase()}`}>
          <Feather name="phone" size={16} color="#FFFFFF" />
        </Pressable>
      </View>
    )}
  </View>
);

const ReportSheet = ({ visible, busy, onClose, onSubmit }: { visible: boolean; busy: boolean; onClose: () => void; onSubmit: (reason: string) => void }) => {
  const insets = useSafeAreaInsets();
  const [choice, setChoice] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  useEffect(() => {
    if (visible) {
      setChoice(null);
      setDetails('');
    }
  }, [visible]);
  const reason = choice === 'Something else' ? details.trim() : [choice, details.trim()].filter(Boolean).join('. ');
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: gutter, paddingTop: 12 }}>
            <View style={{ flex: 1 }}>
              <AppText variant="heading">Report a problem</AppText>
              <AppText variant="small" color={color.muted}>
                The vendor is not paid until Escardia looks into it.
              </AppText>
            </View>
            <IconButton icon="x" size={36} onPress={onClose} accessibilityLabel="Close" />
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingTop: 14 }} keyboardShouldPersistTaps="handled">
            {REASONS.map((r) => (
              <Pressable key={r} onPress={() => setChoice(r)} style={[styles.reason, choice === r && styles.reasonOn]}>
                <AppText variant="bodyMedium" style={{ flex: 1 }}>
                  {r}
                </AppText>
                <Feather name={choice === r ? 'check-circle' : 'circle'} size={18} color={choice === r ? color.primary : color.borderStrong} />
              </Pressable>
            ))}
            <TextInput
              keyboardAppearance={isDark() ? 'dark' : 'light'}
              value={details}
              onChangeText={setDetails}
              placeholder={choice === 'Something else' ? 'Tell us what happened' : 'Add details (optional)'}
              placeholderTextColor={color.subtle}
              multiline
              maxLength={500}
              style={styles.input}
            />
            <Button title="Send report" onPress={() => onSubmit(reason)} loading={busy} disabled={!choice || reason.length < 4} style={{ marginTop: 14 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = themed(() => StyleSheet.create({
  photo: { width: '100%', height: 170, backgroundColor: color.sunken },
  timeline: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, padding: 12, borderRadius: radius.md, backgroundColor: color.sunken },
  place: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: color.primarySoft, alignItems: 'center', justifyContent: 'center' },
  call: { width: 38, height: 38, borderRadius: 19, backgroundColor: color.success, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: color.border, marginVertical: 4 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    paddingHorizontal: gutter,
    paddingTop: 14,
    backgroundColor: color.surface,
    borderTopWidth: 1,
    borderTopColor: color.border,
  },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: color.overlay },
  sheet: { backgroundColor: color.surface, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, maxHeight: '90%' },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: color.border, marginTop: 10 },
  reason: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: color.border, marginBottom: 8 },
  reasonOn: { borderColor: color.primary, backgroundColor: color.highlight },
  input: {
    minHeight: 80,
    marginTop: 6,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    fontFamily: font.regular,
    fontSize: 15,
    color: color.ink,
    textAlignVertical: 'top',
  },
}));

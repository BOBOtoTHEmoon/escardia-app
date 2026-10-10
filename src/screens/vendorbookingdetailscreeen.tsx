// One booking from the vendor's side: payout, trip, driver assignment, customer contact and actions.
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getBooking, assignDriver, cancelBooking, completeTrip, Booking } from '../services/bookingService';
import { getDrivers, Driver } from '../services/vendorService';
import { useAppSettings } from '../hooks/useAppSettings';
import { TripMap } from '../components/TripMap';
import { AppText, Button, IconName, Screen, ScreenHeader, TextField } from '../ui';
import { Avatar } from '../ui/Avatar';
import { BottomBar, InfoRow, Panel } from '../ui/Booking';
import { naira } from '../ui/CarCard';
import { StatusPill } from '../ui/Status';
import { BottomSheet, EmptyState } from '../ui/Kit';
import { color, gutter, radius, themed, statusBarStyle } from '../theme';

interface VendorBookingDetailScreenProps {
  bookingId: string;
  onNavigateBack: () => void;
  onManageDrivers: () => void;
}

const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }) : '';

const call = (phone: string) => Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`).catch(() => Alert.alert('Could not start the call', phone));
const text = (phone: string) => Linking.openURL(`sms:${phone.replace(/[^\d+]/g, '')}`).catch(() => Alert.alert('Could not open messages', phone));

export const VendorBookingDetailScreen: React.FC<VendorBookingDetailScreenProps> = ({ bookingId, onNavigateBack, onManageDrivers }) => {
  const insets = useSafeAreaInsets();
  const { settings } = useAppSettings();
  const [b, setB] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<Driver[] | null>(null);
  const [driverSheet, setDriverSheet] = useState(false);
  const [cancelSheet, setCancelSheet] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<'driver' | 'complete' | 'cancel' | null>(null);

  const load = useCallback(async () => {
    const r = await getBooking(bookingId);
    setB(r.success && r.booking ? r.booking : null);
    setLoading(false);
  }, [bookingId]);

  useEffect(() => {
    load();
  }, [load]);

  const openDrivers = async () => {
    setDriverSheet(true);
    if (!drivers) setDrivers(await getDrivers().catch(() => []));
  };

  if (loading) {
    return (
      <Screen>
        <ScreenHeader title="Booking" onBack={onNavigateBack} />
        <View style={styles.center}>
          <ActivityIndicator color={color.primary} />
        </View>
      </Screen>
    );
  }

  if (!b) {
    return (
      <Screen>
        <ScreenHeader title="Booking" onBack={onNavigateBack} />
        <EmptyState icon="alert-circle" title="Booking not found" body="It may have been removed." />
      </Screen>
    );
  }

  const active = b.bookingStatus === 'confirmed' || b.bookingStatus === 'ongoing';
  const started = new Date(b.startAt) <= new Date();
  const canComplete = active && started;
  const canCancel = b.bookingStatus === 'confirmed' && !started;
  const escortCount = (t: string) => (b.escort ?? []).filter((e: any) => e?.type === t).reduce((n: number, e: any) => n + (e?.count ?? 0), 0);
  const security = [
    escortCount('legion') > 0 && `${escortCount('legion')} LEGION`,
    escortCount('private') > 0 && `${escortCount('private')} PRIVATE`,
    b.hiluxCount > 0 && `${b.hiluxCount} Hilux`,
  ].filter(Boolean) as string[];

  const payout = (() => {
    if (b.bookingStatus === 'cancelled') return { icon: 'x-circle' as IconName, tone: color.muted, text: b.cancelledBy === 'customer' ? 'Cancelled by the customer' : 'Cancelled' };
    if (b.bookingStatus === 'disputed') return { icon: 'pause-circle' as IconName, tone: color.danger, text: 'Paused while Escardia reviews a problem' };
    if (b.releasedAt) return { icon: 'check-circle' as IconName, tone: color.success, text: 'Added to your available balance' };
    if (b.releaseAt) return { icon: 'clock' as IconName, tone: color.warning, text: `Available from ${fmt(b.releaseAt)}` };
    return { icon: 'clock' as IconName, tone: color.warning, text: `On hold until ${settings.payoutHoldHours} hours after the trip ends` };
  })();

  const pickDriver = async (d: Driver) => {
    setBusy('driver');
    const r = await assignDriver(b.id, d.id);
    setBusy(null);
    if (!r.success) return Alert.alert('Could not assign', r.error || 'Please try again.');
    setDriverSheet(false);
    setB({ ...b, driver: { id: d.id, name: d.name, phone: d.phone, photo_url: d.photoUrl } });
  };

  const complete = () =>
    Alert.alert(
      'Mark trip as completed?',
      `Confirm the car is back. The customer then has ${settings.payoutHoldHours} hours to report a problem before your ${naira(b.vendorAmount)} becomes available.`,
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Yes, completed',
          onPress: async () => {
            setBusy('complete');
            const r = await completeTrip(b.id);
            setBusy(null);
            if (!r.success) return Alert.alert('Could not complete', r.error || 'Please try again.');
            load();
          },
        },
      ]
    );

  const cancel = async () => {
    setBusy('cancel');
    const r = await cancelBooking(b.id, reason.trim() || undefined);
    setBusy(null);
    if (!r.success) return Alert.alert('Could not cancel', r.error || 'Please try again.');
    setCancelSheet(false);
    load();
  };

  return (
    <Screen>
      <StatusBar style={statusBarStyle()} />
      <ScreenHeader title={`Booking ${b.code}`} subtitle={`Booked ${fmt(b.createdAt)}`} onBack={onNavigateBack} right={<StatusPill status={b.bookingStatus} />} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: (canComplete || canCancel ? 130 : 40) + insets.bottom }} showsVerticalScrollIndicator={false}>
        {/* Car */}
        <View style={styles.car}>
          {b.car.photos?.[0] ? <Image source={{ uri: b.car.photos[0] }} style={styles.carPhoto} /> : <View style={styles.carPhoto} />}
          <View style={{ flex: 1 }}>
            <AppText variant="subheading" numberOfLines={1}>
              {b.car.brand} {b.car.model}
            </AppText>
            <AppText variant="small" color={color.muted}>
              {[b.car.year, `${b.duration} ${b.durationType}${b.duration === 1 ? '' : 's'}`].filter(Boolean).join(' · ')}
            </AppText>
          </View>
        </View>

        {/* Dispute */}
        {b.bookingStatus === 'disputed' && (
          <View style={styles.alert}>
            <Feather name="alert-triangle" size={18} color={color.danger} />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyMedium" color={color.danger}>
                The customer reported a problem
              </AppText>
              {!!b.disputeReason && (
                <AppText variant="small" color={color.text} style={{ marginTop: 2 }}>
                  “{b.disputeReason}”
                </AppText>
              )}
              <AppText variant="small" color={color.muted} style={{ marginTop: 6 }}>
                Escardia will contact you and decide the payout. You will be notified of the outcome.
              </AppText>
            </View>
          </View>
        )}

        {/* Payout */}
        <Panel style={{ marginTop: 16 }}>
          <AppText variant="small" color={color.muted}>
            Your payout
          </AppText>
          <AppText variant="title" color={b.bookingStatus === 'cancelled' ? color.muted : color.ink}>
            {naira(b.vendorAmount)}
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 10 }}>
            <Feather name={payout.icon} size={14} color={payout.tone} />
            <AppText variant="smallMedium" color={payout.tone}>
              {payout.text}
            </AppText>
          </View>
          <View style={styles.divider} />
          <InfoRow label="Car rental" value={naira(b.baseRental)} />
          {b.deliveryFee > 0 && <InfoRow label="Delivery" value={naira(b.deliveryFee)} />}
          <InfoRow label="Escardia commission" value={<AppText variant="bodyMedium" color={color.muted}>-{naira(b.commissionAmount)}</AppText>} />
          <InfoRow label="You receive" value={naira(b.vendorAmount)} strong />
        </Panel>

        {/* Trip */}
        <AppText variant="heading" style={styles.h}>
          Trip
        </AppText>
        <View style={styles.timeline}>
          <TimelineRow icon="log-out" label="Pick-up" date={b.startDate} time={b.startTime} />
          <View style={styles.timelineLine} />
          <TimelineRow icon="log-in" label="Return" date={b.endDate} time={b.stopTime} />
        </View>
        <Panel style={{ marginTop: 10 }}>
          <InfoRow icon={b.pickupMethod === 'delivery' ? 'truck' : 'map-pin'} label={b.pickupMethod === 'delivery' ? 'Deliver to' : 'Customer collects from'} value={b.deliveryAddress || b.pickupLocation || b.car.location || 'Your location'} />
          {security.length > 0 && <InfoRow icon="shield" label="Security" value={security.join(', ')} />}
        </Panel>
        {security.length > 0 && (
          <AppText variant="small" color={color.muted} style={{ marginTop: 8 }}>
            Escardia arranges the security team for this trip.
          </AppText>
        )}
        {b.pickupMethod === 'delivery' && !!(b.deliveryAddress || b.pickupLocation) && (
          <View style={styles.map}>
            <TripMap address={(b.deliveryAddress || b.pickupLocation)!} label="Delivery" height={180} />
          </View>
        )}

        {/* Driver */}
        <AppText variant="heading" style={styles.h}>
          Driver
        </AppText>
        {b.driver ? (
          <View style={styles.person}>
            <Avatar uri={b.driver.photo_url} name={b.driver.name} size={44} background={color.primary} ring="transparent" />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyMedium">{b.driver.name}</AppText>
              <AppText variant="small" color={color.muted}>
                {b.driver.phone || 'No phone number'}
              </AppText>
            </View>
            {!!b.driver.phone && <RoundAction icon="phone" label="Call driver" onPress={() => call(b.driver!.phone)} />}
            {active && <RoundAction icon="repeat" label="Change driver" onPress={openDrivers} />}
          </View>
        ) : active ? (
          <Pressable onPress={openDrivers} style={styles.assign}>
            <View style={styles.assignIcon}>
              <Feather name="user-plus" size={18} color={color.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyMedium">Assign a driver</AppText>
              <AppText variant="small" color={color.muted}>
                The customer sees their name and number once you do.
              </AppText>
            </View>
            <Feather name="chevron-right" size={18} color={color.subtle} />
          </Pressable>
        ) : (
          <AppText variant="body" color={color.muted}>
            No driver was assigned.
          </AppText>
        )}

        {/* Customer */}
        <AppText variant="heading" style={styles.h}>
          Customer
        </AppText>
        <View style={styles.person}>
          <Avatar name={b.customerName} size={44} background={color.navySoft} ring="transparent" />
          <View style={{ flex: 1 }}>
            <AppText variant="bodyMedium">{b.customerName}</AppText>
            <AppText variant="small" color={color.muted}>
              {b.customerPhone || b.customerEmail || 'No contact details'}
            </AppText>
          </View>
          {!!b.customerPhone && active && (
            <>
              <RoundAction icon="message-square" label="Text customer" onPress={() => text(b.customerPhone)} />
              <RoundAction icon="phone" label="Call customer" onPress={() => call(b.customerPhone)} />
            </>
          )}
        </View>

        {b.bookingStatus === 'cancelled' && (
          <AppText variant="small" color={color.muted} style={{ marginTop: 16 }}>
            Cancelled {fmt(b.cancelledAt)}
            {b.cancelledBy === 'vendor' ? ' by you. The customer was refunded in full.' : b.cancelledBy === 'customer' ? ' by the customer.' : '.'}
          </AppText>
        )}
        {canCancel && (
          <Pressable onPress={() => setCancelSheet(true)} style={styles.cancelLink} hitSlop={6}>
            <AppText variant="smallMedium" color={color.danger}>
              Cancel this booking
            </AppText>
          </Pressable>
        )}
      </ScrollView>

      {canComplete && <BottomBar button={<Button title="Mark trip as completed" icon="check-circle" onPress={complete} loading={busy === 'complete'} />} />}
      {!canComplete && b.bookingStatus === 'confirmed' && !b.driver && (
        <BottomBar button={<Button title="Assign a driver" icon="user-plus" onPress={openDrivers} />} />
      )}

      <BottomSheet visible={driverSheet} onClose={() => setDriverSheet(false)} title="Choose a driver" subtitle={`For ${b.startDate} at ${b.startTime}`}>
        {drivers === null ? (
          <ActivityIndicator color={color.primary} style={{ marginVertical: 24 }} />
        ) : drivers.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <AppText variant="body" color={color.muted} center>
              You have not added any drivers yet.
            </AppText>
            <Button
              title="Add a driver"
              icon="user-plus"
              size="md"
              onPress={() => {
                setDriverSheet(false);
                onManageDrivers();
              }}
              style={{ marginTop: 14, alignSelf: 'stretch' }}
            />
          </View>
        ) : (
          <ScrollView style={{ maxHeight: 360 }}>
            {drivers.map((d) => {
              const on = b.driver?.id === d.id;
              return (
                <Pressable key={d.id} onPress={() => pickDriver(d)} disabled={busy === 'driver'} style={[styles.driverOption, on && styles.driverOn]}>
                  <Avatar uri={d.photoUrl} name={d.name} size={40} background={color.primary} ring="transparent" />
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyMedium">{d.name}</AppText>
                    <AppText variant="small" color={color.muted}>
                      {d.phone || 'No phone number'}
                    </AppText>
                  </View>
                  {on ? <Feather name="check-circle" size={20} color={color.primary} /> : <View style={styles.radio} />}
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </BottomSheet>

      <BottomSheet visible={cancelSheet} onClose={() => setCancelSheet(false)} title="Cancel this booking?" subtitle="The customer gets a full refund and you are not paid for this trip. Cancelling often can get your account suspended.">
        <TextField label="Reason (shared with Escardia)" placeholder="For example, the car developed a fault" value={reason} onChangeText={setReason} />
        <Button title="Cancel booking" variant="danger" onPress={cancel} loading={busy === 'cancel'} />
        <Button title="Keep booking" variant="secondary" onPress={() => setCancelSheet(false)} style={{ marginTop: 10 }} />
      </BottomSheet>
    </Screen>
  );
};

const TimelineRow = ({ icon, label, date, time }: { icon: IconName; label: string; date: string; time: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
    <View style={styles.timelineIcon}>
      <Feather name={icon} size={15} color={color.primary} />
    </View>
    <AppText variant="body" color={color.muted} style={{ flex: 1 }}>
      {label}
    </AppText>
    <View style={{ alignItems: 'flex-end' }}>
      <AppText variant="bodyMedium">{date}</AppText>
      <AppText variant="small" color={color.muted}>
        {time}
      </AppText>
    </View>
  </View>
);

const RoundAction = ({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) => (
  <Pressable onPress={onPress} style={styles.round} accessibilityLabel={label} hitSlop={4}>
    <Feather name={icon} size={16} color={color.primary} />
  </Pressable>
);

const styles = themed(() => StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  car: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.xl, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border },
  carPhoto: { width: 86, height: 62, borderRadius: 12, backgroundColor: color.sunken },
  alert: { flexDirection: 'row', gap: 12, marginTop: 16, padding: 14, borderRadius: radius.lg, backgroundColor: color.dangerSoft },
  divider: { height: 1, backgroundColor: color.border, marginBottom: 4 },
  h: { marginTop: 24, marginBottom: 12 },
  timeline: { padding: 14, borderRadius: radius.xl, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border },
  timelineIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: color.primarySoft, alignItems: 'center', justifyContent: 'center' },
  timelineLine: { width: 2, height: 16, marginLeft: 15, marginVertical: 4, backgroundColor: color.border },
  map: { marginTop: 10, borderRadius: radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: color.border },
  person: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radius.xl, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border },
  round: { width: 38, height: 38, borderRadius: 19, backgroundColor: color.primarySoft, alignItems: 'center', justifyContent: 'center' },
  assign: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.xl, backgroundColor: color.surface, borderWidth: 1.5, borderColor: color.warningBorder },
  assignIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: color.warningSoft, alignItems: 'center', justifyContent: 'center' },
  cancelLink: { alignSelf: 'center', marginTop: 24, padding: 8 },
  driverOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, marginBottom: 8, borderRadius: radius.lg, borderWidth: 1, borderColor: color.border },
  driverOn: { borderColor: color.primary, backgroundColor: color.primarySoft },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: color.borderStrong },
}));

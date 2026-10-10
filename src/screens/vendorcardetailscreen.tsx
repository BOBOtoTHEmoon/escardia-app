// One car in the vendor's fleet: photos, review state, availability switch, earnings, details and upcoming trips.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../config/supabase';
import { getVendorCarById, updateCar, updateCarStatus, deleteCar, Car } from '../services/carservice';
import { getVendorBookings, Booking } from '../services/bookingService';
import { typeLabel } from '../data/carTypes';
import { useAppSettings } from '../hooks/useAppSettings';
import { AppText, Button, IconButton, IconName } from '../ui';
import { BottomBar } from '../ui/Booking';
import { naira } from '../ui/CarCard';
import { EmptyState, Pill, carReview } from '../ui/Kit';
import { VendorBookingCard } from '../ui/VendorCards';
import { brand, color, gutter, radius, themed } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_HEIGHT = 300;

interface VendorCarDetailScreenProps {
  carId: string;
  onNavigateBack: () => void;
  onEditCar: (carId: string) => void;
  /** Called after the car is deleted. */
  onDeleted: () => void;
  onOpenBooking: (bookingId: string) => void;
}

export const VendorCarDetailScreen: React.FC<VendorCarDetailScreenProps> = ({ carId, onNavigateBack, onEditCar, onDeleted, onOpenBooking }) => {
  const insets = useSafeAreaInsets();
  const { settings } = useAppSettings();
  const [car, setCar] = useState<Car | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState(0);

  const load = useCallback(async () => {
    const id = auth.currentUser?.uid ?? '';
    const [c, b] = await Promise.all([getVendorCarById(carId, id), getVendorBookings(id)]);
    setCar(c.success ? c.car! : null);
    setBookings(b.bookings.filter((x) => x.carId === carId));
    setLoading(false);
  }, [carId]);

  useEffect(() => {
    load();
  }, [load]);

  const earned = useMemo(
    () => bookings.filter((b) => ['completed', 'resolved'].includes(b.bookingStatus)).reduce((n, b) => n + b.vendorAmount, 0),
    [bookings]
  );
  const upcoming = useMemo(
    () => bookings.filter((b) => b.bookingStatus === 'confirmed' || b.bookingStatus === 'ongoing').sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt)),
    [bookings]
  );

  if (loading) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color={color.primary} />
      </View>
    );
  }

  if (!car) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
        <View style={{ paddingHorizontal: gutter }}>
          <IconButton icon="chevron-left" onPress={onNavigateBack} accessibilityLabel="Go back" />
        </View>
        <EmptyState icon="alert-circle" title="Car not found" body="It may have been removed." action={<Button title="Back to fleet" size="md" variant="secondary" onPress={onNavigateBack} />} />
      </View>
    );
  }

  const review = carReview(car.approvalStatus, car.isActive, car.status);
  const takingBookings = car.isActive && car.status !== 'maintenance';

  const toggleBookings = async (on: boolean) => {
    setBusy(true);
    const r = on && !car.isActive ? await updateCar(car.id, { isActive: true, status: 'available' }) : await updateCarStatus(car.id, on ? 'available' : 'maintenance');
    setBusy(false);
    if (!r.success) return Alert.alert('Could not update', r.error || 'Please try again.');
    setCar({ ...car, status: on ? 'available' : 'maintenance', isActive: on ? true : car.isActive });
  };

  const remove = () => {
    Alert.alert('Remove this car?', `${car.brand} ${car.model} will be removed from your fleet. This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          const r = await deleteCar(car.id);
          if (r.success) {
            setBusy(false);
            return onDeleted();
          }
          // Cars with booking history cannot be deleted; hide them instead.
          const hidden = await updateCar(car.id, { isActive: false });
          setBusy(false);
          if (hidden.success) {
            setCar({ ...car, isActive: false });
            Alert.alert('Car hidden', 'This car has past bookings, so we kept its history and hid it from customers instead. You can switch it back on at any time.');
          } else Alert.alert('Could not remove', r.error || 'Please try again.');
        },
      },
    ]);
  };

  const specs: { icon: IconName; label: string; value: string }[] = [
    { icon: 'users', label: 'Seats', value: String(car.seats || '-') },
    { icon: 'columns', label: 'Doors', value: String(car.doors || '-') },
    { icon: 'settings', label: 'Gearbox', value: car.transmission ? typeLabel(car.transmission) : '-' },
    { icon: 'droplet', label: 'Fuel', value: car.fuelType ? typeLabel(car.fuelType) : '-' },
  ];

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}>
        <View style={{ height: PHOTO_HEIGHT, backgroundColor: color.navy }}>
          {car.photos.length ? (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={(e) => setPhoto(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))}>
              {car.photos.map((uri) => (
                <Image key={uri} source={{ uri }} style={{ width: SCREEN_WIDTH, height: PHOTO_HEIGHT }} resizeMode="cover" />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.center, { flex: 1 }]}>
              <Feather name="image" size={36} color="rgba(255,255,255,0.3)" />
            </View>
          )}
          <View style={[styles.photoBar, { top: insets.top + 8 }]}>
            <IconButton icon="chevron-left" onPress={onNavigateBack} accessibilityLabel="Go back" />
            <IconButton icon="edit-2" onPress={() => onEditCar(car.id)} accessibilityLabel="Edit car" />
          </View>
          {car.photos.length > 1 && (
            <View style={styles.counter}>
              <AppText variant="smallMedium" color="#FFFFFF" style={{ fontSize: 12 }}>
                {photo + 1} / {car.photos.length}
              </AppText>
            </View>
          )}
        </View>

        <View style={styles.sheet}>
          <Pill label={review.label} tone={review.tone} />
          <AppText variant="title" style={{ marginTop: 10 }}>
            {car.brand} {car.model}
          </AppText>
          <AppText variant="small" color={color.muted} style={{ marginTop: 2 }}>
            {[car.year, typeLabel(car.type), car.location].filter(Boolean).join(' · ')}
          </AppText>

          {car.approvalStatus === 'pending' && (
            <Notice icon="clock" tone="amber" title="Escardia is reviewing this car" body="It goes live as soon as it is approved. We will notify you." />
          )}
          {car.approvalStatus === 'rejected' && (
            <Notice
              icon="alert-circle"
              tone="red"
              title="Changes needed"
              body={car.rejectionReason || 'Edit the car and submit it again.'}
              action="Edit and resubmit"
              onAction={() => onEditCar(car.id)}
            />
          )}

          {car.approvalStatus === 'approved' && (
            <View style={styles.toggle}>
              <View style={[styles.toggleIcon, { backgroundColor: takingBookings ? color.successSoft : color.sunken }]}>
                <Feather name={takingBookings ? 'check-circle' : 'pause-circle'} size={18} color={takingBookings ? color.success : color.muted} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyMedium">{takingBookings ? 'Taking bookings' : car.isActive ? 'Paused for maintenance' : 'Hidden from customers'}</AppText>
                <AppText variant="small" color={color.muted}>
                  {takingBookings ? 'Customers can find and book this car.' : 'Turn on when the car is ready again.'}
                </AppText>
              </View>
              {busy ? (
                <ActivityIndicator color={color.primary} />
              ) : (
                <Switch value={takingBookings} onValueChange={toggleBookings} trackColor={{ true: color.primary, false: color.borderStrong }} thumbColor="#FFFFFF" />
              )}
            </View>
          )}

          <View style={styles.stats}>
            <Stat label="Trips" value={String(car.totalBookings)} />
            <View style={styles.statDivider} />
            <Stat label="You earned" value={naira(earned)} />
            <View style={styles.statDivider} />
            <Stat label="Rating" value={car.rating?.totalReviews ? `${car.rating.averageOverall.toFixed(1)} ★` : 'New'} />
          </View>

          <AppText variant="heading" style={styles.h}>
            Prices
          </AppText>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={styles.price}>
              <AppText variant="small" color={color.muted}>
                Per day
              </AppText>
              <AppText variant="heading">{naira(car.pricePerDay)}</AppText>
              <AppText variant="small" color={color.success} style={{ fontSize: 12 }}>
                You get {naira(Math.round(car.pricePerDay * (1 - settings.commissionRate)))}
              </AppText>
            </View>
            <View style={styles.price}>
              <AppText variant="small" color={color.muted}>
                Per hour
              </AppText>
              <AppText variant="heading">{car.pricePerHour ? naira(car.pricePerHour) : 'Off'}</AppText>
              <AppText variant="small" color={car.pricePerHour ? color.success : color.muted} style={{ fontSize: 12 }}>
                {car.pricePerHour ? `You get ${naira(Math.round(car.pricePerHour * (1 - settings.commissionRate)))}` : 'Daily bookings only'}
              </AppText>
            </View>
          </View>

          <AppText variant="heading" style={styles.h}>
            Details
          </AppText>
          <View style={styles.specs}>
            {specs.map((s) => (
              <View key={s.label} style={styles.spec}>
                <View style={styles.specIcon}>
                  <Feather name={s.icon} size={16} color={color.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="small" color={color.muted}>
                    {s.label}
                  </AppText>
                  <AppText variant="bodyMedium" numberOfLines={1}>
                    {s.value}
                  </AppText>
                </View>
              </View>
            ))}
          </View>
          {!!car.description && (
            <AppText variant="body" color={color.text} style={{ marginTop: 14 }}>
              {car.description}
            </AppText>
          )}

          <AppText variant="heading" style={styles.h}>
            Upcoming trips
          </AppText>
          {upcoming.length ? (
            upcoming.map((b) => <VendorBookingCard key={b.id} booking={b} onPress={() => onOpenBooking(b.id)} />)
          ) : (
            <AppText variant="body" color={color.muted}>
              No upcoming trips for this car.
            </AppText>
          )}

          <Pressable onPress={remove} disabled={busy} style={styles.remove} accessibilityRole="button">
            <Feather name="trash-2" size={16} color={color.danger} />
            <AppText variant="bodyMedium" color={color.danger}>
              Remove from fleet
            </AppText>
          </Pressable>
        </View>
      </ScrollView>

      <BottomBar button={<Button title="Edit car" icon="edit-2" onPress={() => onEditCar(car.id)} />} />
    </View>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <View style={{ flex: 1, alignItems: 'center' }}>
    <AppText variant="subheading" numberOfLines={1} adjustsFontSizeToFit>
      {value}
    </AppText>
    <AppText variant="small" color={color.muted}>
      {label}
    </AppText>
  </View>
);

const Notice = ({
  icon,
  tone,
  title,
  body,
  action,
  onAction,
}: {
  icon: IconName;
  tone: 'amber' | 'red';
  title: string;
  body: string;
  action?: string;
  onAction?: () => void;
}) => (
  <View style={[styles.notice, { backgroundColor: tone === 'amber' ? color.warningSoft : color.dangerSoft }]}>
    <Feather name={icon} size={18} color={tone === 'amber' ? color.warning : color.danger} style={{ marginTop: 1 }} />
    <View style={{ flex: 1 }}>
      <AppText variant="bodyMedium" color={tone === 'amber' ? color.warning : color.danger}>
        {title}
      </AppText>
      <AppText variant="small" color={color.text} style={{ marginTop: 2 }}>
        {body}
      </AppText>
      {!!action && (
        <Pressable onPress={onAction} hitSlop={6} style={{ marginTop: 8 }}>
          <AppText variant="smallMedium" color={color.primary}>
            {action}
          </AppText>
        </Pressable>
      )}
    </View>
  </View>
);

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  photoBar: { position: 'absolute', left: gutter, right: gutter, flexDirection: 'row', justifyContent: 'space-between' },
  counter: { position: 'absolute', right: gutter, bottom: 36, paddingHorizontal: 10, height: 26, borderRadius: 13, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'center' },
  sheet: { marginTop: -24, backgroundColor: color.bg, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, paddingHorizontal: gutter, paddingTop: 24 },
  notice: { flexDirection: 'row', gap: 12, marginTop: 16, padding: 14, borderRadius: radius.lg },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16, padding: 14, borderRadius: radius.lg, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border },
  toggleIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingVertical: 14, borderRadius: radius.lg, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border },
  statDivider: { width: 1, height: 30, backgroundColor: color.border },
  h: { marginTop: 24, marginBottom: 12 },
  price: { flex: 1, padding: 14, borderRadius: radius.lg, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border },
  specs: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  spec: {
    width: (SCREEN_WIDTH - gutter * 2 - 10) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  specIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: color.primarySoft, alignItems: 'center', justifyContent: 'center' },
  remove: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 28, height: 48, borderRadius: radius.lg, borderWidth: 1, borderColor: color.dangerBorder, backgroundColor: color.dangerSoft },
}));

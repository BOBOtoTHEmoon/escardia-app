// Cards for the vendor screens: a booking (from the vendor's side) and a car in the fleet.
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppText } from './index';
import { naira } from './CarCard';
import { StatusPill, relativeTime } from './Status';
import { Pill, carReview } from './Kit';
import type { Booking } from '../services/bookingService';
import type { Car } from '../services/carservice';
import { typeLabel } from '../data/carTypes';
import { color, radius, shadow, themed } from '../theme';

const Thumb = ({ uri, w = 76, h = 58 }: { uri?: string; w?: number; h?: number }) =>
  uri ? (
    <Image source={{ uri }} style={[styles.thumb, { width: w, height: h }]} />
  ) : (
    <View style={[styles.thumb, { width: w, height: h, alignItems: 'center', justifyContent: 'center' }]}>
      <Feather name="image" size={18} color={color.subtle} />
    </View>
  );

/** True when the vendor still has to put a driver on this booking. */
export const needsDriver = (b: Booking) => (b.bookingStatus === 'confirmed' || b.bookingStatus === 'ongoing') && !b.driver;

export const VendorBookingCard = ({ booking: b, onPress }: { booking: Booking; onPress: () => void }) => {
  const when =
    b.bookingStatus === 'confirmed' ? relativeTime(b.startAt, 'Starts in') : b.bookingStatus === 'ongoing' ? relativeTime(b.endAt, 'Ends in') : '';
  const missingDriver = needsDriver(b);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, shadow.sm, pressed && { opacity: 0.95 }]}>
      <View style={styles.row}>
        <Thumb uri={b.car.photos?.[0]} />
        <View style={{ flex: 1 }}>
          <AppText variant="subheading" numberOfLines={1}>
            {b.car.brand} {b.car.model}
          </AppText>
          <View style={[styles.titleRow, { marginTop: 2 }]}>
            <AppText variant="small" color={color.muted} numberOfLines={1} style={{ flex: 1 }}>
              {b.customerName} · {b.code}
            </AppText>
            <AppText variant="bodyMedium" color={b.bookingStatus === 'cancelled' ? color.muted : color.success}>
              {naira(b.vendorAmount)}
            </AppText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            <StatusPill status={b.bookingStatus} />
            {!!when && (
              <AppText variant="smallMedium" color={color.primary}>
                {when}
              </AppText>
            )}
          </View>
        </View>
      </View>

      <View style={styles.dates}>
        <View style={{ flex: 1 }}>
          <AppText variant="small" color={color.muted} style={{ fontSize: 12 }}>
            Pick-up
          </AppText>
          <AppText variant="smallMedium">{b.startDate}</AppText>
          <AppText variant="small" color={color.muted}>
            {b.startTime}
          </AppText>
        </View>
        <Feather name="arrow-right" size={14} color={color.subtle} />
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <AppText variant="small" color={color.muted} style={{ fontSize: 12 }}>
            Return
          </AppText>
          <AppText variant="smallMedium">{b.endDate}</AppText>
          <AppText variant="small" color={color.muted}>
            {b.stopTime}
          </AppText>
        </View>
      </View>

      {(b.bookingStatus === 'confirmed' || b.bookingStatus === 'ongoing') && (
        <View style={[styles.driver, missingDriver && styles.driverMissing]}>
          <Feather name={missingDriver ? 'alert-circle' : 'user-check'} size={14} color={missingDriver ? color.warning : color.success} />
          <AppText variant="smallMedium" color={missingDriver ? color.warning : color.text} numberOfLines={1} style={{ flex: 1 }}>
            {missingDriver ? 'No driver assigned yet' : `Driver: ${b.driver?.name}`}
          </AppText>
          {missingDriver && <Feather name="chevron-right" size={16} color={color.warning} />}
        </View>
      )}
    </Pressable>
  );
};

export const FleetCarCard = ({ car, onPress }: { car: Car; onPress: () => void }) => {
  const review = carReview(car.approvalStatus, car.isActive, car.status);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, shadow.sm, { padding: 0, overflow: 'hidden' }, pressed && { opacity: 0.95 }]}>
      <View>
        {car.photos?.[0] ? (
          <Image source={{ uri: car.photos[0] }} style={styles.hero} />
        ) : (
          <View style={[styles.hero, { alignItems: 'center', justifyContent: 'center' }]}>
            <Feather name="image" size={22} color={color.subtle} />
          </View>
        )}
        <Pill label={review.label} tone={review.tone} style={styles.heroPill} />
        {car.photos.length > 1 && (
          <View style={styles.photoCount}>
            <Feather name="image" size={11} color="#FFFFFF" />
            <AppText variant="smallMedium" color="#FFFFFF" style={{ fontSize: 11 }}>
              {car.photos.length}
            </AppText>
          </View>
        )}
      </View>
      <View style={{ padding: 14 }}>
        <View style={styles.titleRow}>
          <AppText variant="subheading" numberOfLines={1} style={{ flex: 1 }}>
            {car.brand} {car.model}
          </AppText>
          <AppText variant="subheading">{naira(car.pricePerDay)}</AppText>
        </View>
        <View style={[styles.titleRow, { marginTop: 2 }]}>
          <AppText variant="small" color={color.muted} numberOfLines={1} style={{ flex: 1 }}>
            {[car.year, typeLabel(car.type), car.location].filter(Boolean).join(' · ')}
          </AppText>
          <AppText variant="small" color={color.muted}>
            per day
          </AppText>
        </View>
        <View style={styles.meta}>
          <Meta icon="calendar" text={`${car.totalBookings} trip${car.totalBookings === 1 ? '' : 's'}`} />
          <Meta icon="star" text={car.rating?.totalReviews ? `${car.rating.averageOverall.toFixed(1)} (${car.rating.totalReviews})` : 'No ratings'} />
          {car.pricePerHour > 0 && <Meta icon="clock" text={`${naira(car.pricePerHour)}/hr`} />}
        </View>
        {car.approvalStatus === 'rejected' && !!car.rejectionReason && (
          <View style={styles.reject}>
            <Feather name="alert-circle" size={14} color={color.danger} />
            <AppText variant="small" color={color.danger} style={{ flex: 1 }} numberOfLines={2}>
              {car.rejectionReason}
            </AppText>
          </View>
        )}
      </View>
    </Pressable>
  );
};

const Meta = ({ icon, text }: { icon: React.ComponentProps<typeof Feather>['name']; text: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
    <Feather name={icon} size={13} color={color.muted} />
    <AppText variant="small" color={color.text}>
      {text}
    </AppText>
  </View>
);

const styles = themed(() => StyleSheet.create({
  card: { backgroundColor: color.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: color.border, padding: 14, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  thumb: { borderRadius: 12, backgroundColor: color.sunken },
  dates: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, padding: 10, borderRadius: radius.md, backgroundColor: color.sunken },
  driver: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, paddingHorizontal: 10, height: 36, borderRadius: radius.md, backgroundColor: color.successSoft },
  driverMissing: { backgroundColor: color.warningSoft },
  hero: { width: '100%', height: 170, backgroundColor: color.sunken },
  heroPill: { position: 'absolute', top: 12, left: 12, backgroundColor: color.surface },
  photoCount: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(11,21,48,0.7)',
  },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: color.border },
  reject: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 10, padding: 10, borderRadius: radius.md, backgroundColor: color.dangerSoft },
}));

// Vendor performance: bookings, cancellations, ratings and the cars that earn the most.
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { supabase, auth } from '../config/supabase';
import { getVendorBookings, Booking } from '../services/bookingService';
import { AppText, Screen, ScreenHeader } from '../ui';
import { naira } from '../ui/CarCard';
import { Segmented, StatTile } from '../ui/Kit';
import { color, gutter, radius, themed, statusBarStyle } from '../theme';

interface VendorAnalyticsScreenProps {
  onNavigateBack: () => void;
}

type Period = '30' | '90' | 'all';
type Rating = { overall: number; car_condition: number; driver_rating: number | null; review: string | null; created_at: string };

const DONE = ['completed', 'resolved'];

export const VendorAnalyticsScreen: React.FC<VendorAnalyticsScreenProps> = ({ onNavigateBack }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [period, setPeriod] = useState<Period>('30');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = auth.currentUser?.uid ?? '';
    Promise.all([
      getVendorBookings(id),
      supabase.from('ratings').select('overall, car_condition, driver_rating, review, created_at').eq('vendor_id', id).order('created_at', { ascending: false }),
    ]).then(([b, r]) => {
      setBookings(b.bookings);
      setRatings((r.data as Rating[]) ?? []);
      setLoading(false);
    });
  }, []);

  const from = period === 'all' ? 0 : Date.now() - Number(period) * 86400000;
  const inPeriod = useMemo(() => bookings.filter((b) => +new Date(b.createdAt) >= from), [bookings, from]);
  const done = inPeriod.filter((b) => DONE.includes(b.bookingStatus));
  const cancelled = inPeriod.filter((b) => b.bookingStatus === 'cancelled');
  const earned = done.reduce((n, b) => n + b.vendorAmount, 0);
  const youCancelled = cancelled.filter((b) => b.cancelledBy === 'vendor').length;

  const topCars = useMemo(() => {
    const m: Record<string, { name: string; photo?: string; trips: number; earned: number }> = {};
    for (const b of done) {
      m[b.carId] ??= { name: `${b.car.brand} ${b.car.model}`, photo: b.car.photos?.[0], trips: 0, earned: 0 };
      m[b.carId].trips++;
      m[b.carId].earned += b.vendorAmount;
    }
    return Object.values(m).sort((a, z) => z.earned - a.earned).slice(0, 5);
  }, [done]);

  const avg = (k: keyof Rating) => {
    const vals = ratings.map((r) => r[k]).filter((v) => v !== null && v !== undefined).map(Number);
    return vals.length ? vals.reduce((n, v) => n + v, 0) / vals.length : 0;
  };
  const reviews = ratings.filter((r) => r.review?.trim()).slice(0, 5);

  return (
    <Screen>
      <StatusBar style={statusBarStyle()} />
      <ScreenHeader title="Performance" onBack={onNavigateBack} />
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={color.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <Segmented
            options={[
              { key: '30', label: '30 days' },
              { key: '90', label: '90 days' },
              { key: 'all', label: 'All time' },
            ]}
            value={period}
            onChange={setPeriod}
          />

          <View style={[styles.grid, { marginTop: 16 }]}>
            <StatTile icon="calendar" label="Bookings" value={String(inPeriod.length)} tone="blue" />
            <StatTile icon="check-circle" label="Completed" value={String(done.length)} tone="green" />
          </View>
          <View style={[styles.grid, { marginTop: 12 }]}>
            <StatTile icon="credit-card" label="Earned" value={naira(earned)} tone="green" />
            <StatTile
              icon="x-circle"
              label="Cancelled"
              value={String(cancelled.length)}
              hint={youCancelled ? `${youCancelled} by you` : undefined}
              tone={youCancelled ? 'amber' : 'slate'}
            />
          </View>

          <AppText variant="heading" style={styles.h}>
            Ratings
          </AppText>
          {ratings.length === 0 ? (
            <View style={styles.card}>
              <AppText variant="body" color={color.muted}>
                Customers can rate a trip once it is completed. Ratings show here.
              </AppText>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{ alignItems: 'center' }}>
                  <AppText variant="display">{avg('overall').toFixed(1)}</AppText>
                  <Stars value={avg('overall')} />
                  <AppText variant="small" color={color.muted} style={{ marginTop: 4 }}>
                    {ratings.length} rating{ratings.length === 1 ? '' : 's'}
                  </AppText>
                </View>
                <View style={{ flex: 1, gap: 10 }}>
                  <Bar label="Car condition" value={avg('car_condition')} />
                  <Bar label="Driver" value={avg('driver_rating')} />
                  <Bar label="Overall" value={avg('overall')} />
                </View>
              </View>
              {reviews.map((r, i) => (
                <View key={i} style={styles.review}>
                  <Stars value={r.overall} size={12} />
                  <AppText variant="body" style={{ marginTop: 4 }}>
                    “{r.review!.trim()}”
                  </AppText>
                  <AppText variant="small" color={color.subtle} style={{ marginTop: 2 }}>
                    {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </AppText>
                </View>
              ))}
            </View>
          )}

          <AppText variant="heading" style={styles.h}>
            Top cars
          </AppText>
          {topCars.length === 0 ? (
            <View style={styles.card}>
              <AppText variant="body" color={color.muted}>
                No completed trips in this period yet.
              </AppText>
            </View>
          ) : (
            <View style={[styles.card, { paddingVertical: 4 }]}>
              {topCars.map((c, i) => (
                <View key={c.name + i} style={[styles.carRow, i < topCars.length - 1 && styles.border]}>
                  <AppText variant="smallMedium" color={color.muted} style={{ width: 16 }}>
                    {i + 1}
                  </AppText>
                  {c.photo ? <Image source={{ uri: c.photo }} style={styles.thumb} /> : <View style={styles.thumb} />}
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyMedium" numberOfLines={1}>
                      {c.name}
                    </AppText>
                    <AppText variant="small" color={color.muted}>
                      {c.trips} trip{c.trips === 1 ? '' : 's'}
                    </AppText>
                  </View>
                  <AppText variant="bodyMedium" color={color.success}>
                    {naira(c.earned)}
                  </AppText>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </Screen>
  );
};

const Stars = ({ value, size = 14 }: { value: number; size?: number }) => (
  <View style={{ flexDirection: 'row', gap: 2 }}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Ionicons key={n} name={value >= n - 0.25 ? 'star' : value >= n - 0.75 ? 'star-half' : 'star-outline'} size={size} color={value >= n - 0.75 ? '#F59E0B' : color.borderStrong} />
    ))}
  </View>
);

const Bar = ({ label, value }: { label: string; value: number }) => (
  <View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <AppText variant="small" color={color.text}>
        {label}
      </AppText>
      <AppText variant="smallMedium">{value.toFixed(1)}</AppText>
    </View>
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${(value / 5) * 100}%` }]} />
    </View>
  </View>
);

const styles = themed(() => StyleSheet.create({
  grid: { flexDirection: 'row', gap: 12 },
  h: { marginTop: 24, marginBottom: 12 },
  card: { padding: 16, borderRadius: radius.xl, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border },
  track: { height: 6, borderRadius: 3, backgroundColor: color.sunken, marginTop: 4, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: '#F59E0B' },
  review: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: color.border },
  carRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  border: { borderBottomWidth: 1, borderBottomColor: color.border },
  thumb: { width: 56, height: 42, borderRadius: 10, backgroundColor: color.sunken },
}));

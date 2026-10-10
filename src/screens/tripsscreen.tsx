import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Image, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../config/supabase';
import { getUserBookings, Booking } from '../services/bookingService';
import ratingService from '../services/ratingservice';
import RatingModal from '../components/ratingmodal';
import { AppText, Button } from '../ui';
import { naira } from '../ui/CarCard';
import { StatusPill, relativeTime } from '../ui/Status';
import { TabBar, TAB_BAR_SPACE } from '../ui/TabBar';
import { color, gutter, radius, shadow, themed, statusBarStyle } from '../theme';

type Tab = 'upcoming' | 'ongoing' | 'past';

const TAB_STATUSES: Record<Tab, string[]> = {
  upcoming: ['confirmed'],
  ongoing: ['ongoing'],
  past: ['completed', 'resolved', 'disputed', 'cancelled', 'expired'],
};

interface TripsScreenProps {
  onNavigateToHome: () => void;
  onNavigateToCars: () => void;
  onNavigateToProfile: () => void;
  onNavigateToTripDetail: (trip: Booking) => void;
}

export const TripsScreen: React.FC<TripsScreenProps> = ({ onNavigateToHome, onNavigateToCars, onNavigateToProfile, onNavigateToTripDetail }) => {
  const insets = useSafeAreaInsets();
  const [trips, setTrips] = useState<Booking[]>([]);
  const [tab, setTab] = useState<Tab | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rating, setRating] = useState<Booking | null>(null);

  const load = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (uid) {
      const res = await getUserBookings(uid);
      setTrips(res.bookings);
      // Open on the most useful tab the first time.
      setTab((current) => current ?? (res.bookings.some((b) => b.bookingStatus === 'ongoing') ? 'ongoing' : res.bookings.some((b) => b.bookingStatus === 'confirmed') ? 'upcoming' : 'past'));
    } else {
      setTab((c) => c ?? 'upcoming');
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const active: Tab = tab ?? 'upcoming';
  const count = (t: Tab) => trips.filter((b) => TAB_STATUSES[t].includes(b.bookingStatus)).length;
  const list = useMemo(() => {
    const l = trips.filter((b) => TAB_STATUSES[active].includes(b.bookingStatus));
    // Soonest first for upcoming; newest first for the rest.
    return active === 'upcoming' ? [...l].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()) : l;
  }, [trips, active]);

  const submitRating = async (data: any) => {
    const user = auth.currentUser;
    if (!user || !rating) return;
    try {
      await ratingService.submitRating(rating.id, rating.carId, user.uid, '', data);
      setRating(null);
      Alert.alert('Thank you', 'Your rating helps other riders choose well.');
      load();
    } catch (e: any) {
      Alert.alert('Could not save rating', e?.message || 'Please try again.');
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style={statusBarStyle()} />
      <View style={styles.header}>
        <AppText variant="title">My trips</AppText>
      </View>

      <View style={styles.tabs}>
        {(['upcoming', 'ongoing', 'past'] as Tab[]).map((t) => {
          const on = active === t;
          const n = count(t);
          return (
            <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, on && styles.tabOn]}>
              <AppText variant="smallMedium" color={on ? color.ink : color.muted} style={{ fontSize: 14 }}>
                {t === 'ongoing' ? 'On the road' : t === 'upcoming' ? 'Upcoming' : 'Past'}
              </AppText>
              {n > 0 && t !== 'past' && (
                <View style={[styles.count, on && { backgroundColor: color.primary }]}>
                  <AppText variant="smallMedium" color={on ? '#FFFFFF' : color.muted} style={{ fontSize: 11, lineHeight: 14 }}>
                    {n}
                  </AppText>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={loading ? [] : list}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ paddingHorizontal: gutter, paddingTop: 8, paddingBottom: TAB_BAR_SPACE, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        ListEmptyComponent={
          loading ? (
            <View>
              {[0, 1].map((i) => (
                <View key={i} style={styles.skeleton} />
              ))}
            </View>
          ) : (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Feather name={active === 'past' ? 'clock' : 'calendar'} size={24} color={color.primary} />
              </View>
              <AppText variant="heading" style={{ marginTop: 16 }}>
                {active === 'upcoming' ? 'No upcoming trips' : active === 'ongoing' ? 'Nothing on the road' : 'No past trips yet'}
              </AppText>
              <AppText variant="body" color={color.muted} center style={{ marginTop: 6, marginBottom: 20 }}>
                {active === 'past' ? 'Trips you finish or cancel show up here.' : 'When you book a car, your trip will show up here.'}
              </AppText>
              {active !== 'past' && <Button title="Find a car" size="md" iconRight="arrow-right" onPress={onNavigateToCars} />}
            </View>
          )
        }
        renderItem={({ item: b }) => {
          const canRate = b.bookingStatus === 'completed' && !b.rated;
          const when =
            b.bookingStatus === 'confirmed' ? relativeTime(b.startAt, 'Starts in') : b.bookingStatus === 'ongoing' ? relativeTime(b.endAt, 'Ends in') : '';
          return (
            <Pressable onPress={() => onNavigateToTripDetail(b)} style={({ pressed }) => [styles.card, shadow.sm, pressed && { opacity: 0.95 }]}>
              <View style={styles.cardTop}>
                {b.car.photos?.[0] ? (
                  <Image source={{ uri: b.car.photos[0] }} style={styles.photo} />
                ) : (
                  <View style={[styles.photo, { alignItems: 'center', justifyContent: 'center' }]}>
                    <Feather name="image" size={18} color={color.subtle} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <AppText variant="subheading" numberOfLines={1}>
                    {b.car.brand} {b.car.model}
                  </AppText>
                  <AppText variant="small" color={color.muted} style={{ marginTop: 2 }}>
                    {b.code} · {naira(b.totalPrice)}
                  </AppText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
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
                  <AppText variant="small" color={color.text}>
                    {b.startTime}
                  </AppText>
                </View>
                <Feather name="arrow-right" size={14} color={color.subtle} />
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <AppText variant="small" color={color.muted} style={{ fontSize: 12 }}>
                    Return
                  </AppText>
                  <AppText variant="smallMedium">{b.endDate}</AppText>
                  <AppText variant="small" color={color.text}>
                    {b.stopTime}
                  </AppText>
                </View>
              </View>
              {canRate && (
                <Pressable onPress={() => setRating(b)} style={styles.rate}>
                  <Feather name="star" size={14} color={color.warning} />
                  <AppText variant="smallMedium" color={color.warning}>
                    Rate this trip
                  </AppText>
                </Pressable>
              )}
            </Pressable>
          );
        }}
      />

      <TabBar
        active="trips"
        onNavigate={(t) => (t === 'home' ? onNavigateToHome() : t === 'cars' ? onNavigateToCars() : t === 'profile' ? onNavigateToProfile() : undefined)}
      />

      {rating && (
        <RatingModal
          visible
          onClose={() => setRating(null)}
          onSubmit={submitRating}
          tripData={{ carName: `${rating.car.brand} ${rating.car.model}`, hadDriver: true }}
        />
      )}
    </View>
  );
};

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  header: { paddingHorizontal: gutter, paddingTop: 16, paddingBottom: 14 },
  tabs: { flexDirection: 'row', marginHorizontal: gutter, padding: 4, borderRadius: radius.lg, backgroundColor: color.sunken, marginBottom: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 38, borderRadius: radius.md },
  tabOn: { backgroundColor: color.surface, ...shadow.sm },
  count: { minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5, backgroundColor: color.border, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: color.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: color.border, padding: 14, marginBottom: 12 },
  cardTop: { flexDirection: 'row', gap: 12 },
  photo: { width: 76, height: 58, borderRadius: 12, backgroundColor: color.sunken },
  dates: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, padding: 10, borderRadius: radius.md, backgroundColor: color.sunken },
  rate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: color.warningSoft,
    borderWidth: 1,
    borderColor: color.warningBorder,
  },
  skeleton: { height: 150, borderRadius: radius.xl, backgroundColor: color.sunken, marginBottom: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 40 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: color.primarySoft, alignItems: 'center', justifyContent: 'center' },
}));

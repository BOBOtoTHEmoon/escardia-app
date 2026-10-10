// Vendor bookings: upcoming, on the road and past, with what each one pays.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../config/supabase';
import { getVendorBookings, Booking } from '../services/bookingService';
import { AppText, Button } from '../ui';
import { EmptyState, Segmented, Skeleton } from '../ui/Kit';
import { VendorBookingCard, needsDriver } from '../ui/VendorCards';
import { VendorTabBar, VendorTab, TAB_BAR_SPACE } from '../ui/TabBar';
import { color, gutter, themed, statusBarStyle } from '../theme';

interface VendorBookingsScreenProps {
  onTab: (tab: VendorTab) => void;
  onViewBookingDetails: (bookingId: string) => void;
}

type Tab = 'upcoming' | 'ongoing' | 'past';

const IN_TAB: Record<Tab, string[]> = {
  upcoming: ['confirmed'],
  ongoing: ['ongoing'],
  past: ['completed', 'resolved', 'disputed', 'cancelled'],
};

export const VendorBookingsScreen: React.FC<VendorBookingsScreenProps> = ({ onTab, onViewBookingDetails }) => {
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState<Tab>('upcoming');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const id = auth.currentUser?.uid;
    if (!id) return setLoading(false);
    const r = await getVendorBookings(id);
    setBookings(r.bookings);
    setError(r.success ? '' : 'Could not load your bookings');
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Start on "On the road" when something is out right now and nothing is upcoming.
  useEffect(() => {
    if (!loading && !bookings.some((b) => b.bookingStatus === 'confirmed') && bookings.some((b) => b.bookingStatus === 'ongoing')) setTab('ongoing');
  }, [loading, bookings]);

  const list = useMemo(() => {
    const l = bookings.filter((b) => IN_TAB[tab].includes(b.bookingStatus));
    return tab === 'past' ? l : [...l].sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt));
  }, [bookings, tab]);

  const count = (t: Tab) => bookings.filter((b) => IN_TAB[t].includes(b.bookingStatus)).length;
  const missing = bookings.filter(needsDriver).length;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style={statusBarStyle()} />
      <View style={styles.header}>
        <AppText variant="title">Bookings</AppText>
        <AppText variant="small" color={missing ? color.warning : color.muted}>
          {missing ? `${missing} booking${missing === 1 ? '' : 's'} still need${missing === 1 ? 's' : ''} a driver` : 'Customers pay in full before a booking shows here'}
        </AppText>
      </View>

      <Segmented
        options={[
          { key: 'upcoming', label: 'Upcoming', count: count('upcoming') },
          { key: 'ongoing', label: 'On the road', count: count('ongoing') },
          { key: 'past', label: 'Past' },
        ]}
        value={tab}
        onChange={setTab}
        style={{ marginHorizontal: gutter, marginBottom: 8 }}
      />

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
        renderItem={({ item }) => <VendorBookingCard booking={item} onPress={() => onViewBookingDetails(item.id)} />}
        ListEmptyComponent={
          loading ? (
            <View>
              <Skeleton height={170} />
              <Skeleton height={170} />
            </View>
          ) : error ? (
            <EmptyState icon="wifi-off" title={error} action={<Button title="Try again" size="md" variant="secondary" onPress={load} />} />
          ) : (
            <EmptyState
              icon={tab === 'past' ? 'clock' : 'calendar'}
              title={tab === 'upcoming' ? 'No upcoming bookings' : tab === 'ongoing' ? 'Nothing on the road' : 'No past bookings yet'}
              body={
                tab === 'upcoming'
                  ? 'When a customer books one of your cars, it shows up here and we notify you.'
                  : tab === 'ongoing'
                    ? 'Trips show here while they are happening.'
                    : 'Completed and cancelled bookings show up here.'
              }
            />
          )
        }
      />
      <VendorTabBar active="bookings" onNavigate={onTab} />
    </View>
  );
};

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  header: { paddingHorizontal: gutter, paddingTop: 16, paddingBottom: 14 },
}));

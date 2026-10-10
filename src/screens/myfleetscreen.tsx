// Vendor fleet: every car with its review state, filterable, plus add a car.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../config/supabase';
import { getVendorCars, Car } from '../services/carservice';
import { AppText, Button } from '../ui';
import { EmptyState, Segmented, Skeleton } from '../ui/Kit';
import { FleetCarCard } from '../ui/VendorCards';
import { VendorTabBar, VendorTab, TAB_BAR_SPACE } from '../ui/TabBar';
import { color, gutter, themed, statusBarStyle } from '../theme';

interface MyFleetScreenProps {
  onTab: (tab: VendorTab) => void;
  onAddCar: () => void;
  onViewCarDetails: (carId: string) => void;
}

type Filter = 'all' | 'live' | 'review' | 'paused';

const matches = (c: Car, f: Filter) => {
  if (f === 'all') return true;
  if (f === 'review') return c.approvalStatus !== 'approved';
  const paused = !c.isActive || c.status === 'maintenance';
  if (f === 'paused') return c.approvalStatus === 'approved' && paused;
  return c.approvalStatus === 'approved' && !paused;
};

export const MyFleetScreen: React.FC<MyFleetScreenProps> = ({ onTab, onAddCar, onViewCarDetails }) => {
  const insets = useSafeAreaInsets();
  const [cars, setCars] = useState<Car[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const id = auth.currentUser?.uid;
    if (!id) return setLoading(false);
    const r = await getVendorCars(id);
    if (r.success) {
      setCars(r.cars ?? []);
      setError('');
    } else setError(r.error || 'Could not load your cars');
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const count = (f: Filter) => cars.filter((c) => matches(c, f)).length;
  const list = useMemo(() => cars.filter((c) => matches(c, filter)), [cars, filter]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style={statusBarStyle()} />
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <AppText variant="title">My fleet</AppText>
          <AppText variant="small" color={color.muted}>
            {loading ? ' ' : cars.length ? `${count('live')} live of ${cars.length} car${cars.length === 1 ? '' : 's'}` : 'No cars yet'}
          </AppText>
        </View>
        <Button title="Add car" size="md" icon="plus" onPress={onAddCar} style={{ paddingHorizontal: 16 }} />
      </View>

      {cars.length > 0 && (
        <Segmented
          options={[
            { key: 'all', label: 'All' },
            { key: 'live', label: 'Live', count: count('live') },
            { key: 'review', label: 'Review', count: count('review') },
            { key: 'paused', label: 'Paused', count: count('paused') },
          ]}
          value={filter}
          onChange={setFilter}
          style={{ marginHorizontal: gutter, marginBottom: 8 }}
        />
      )}

      <FlatList
        data={loading ? [] : list}
        keyExtractor={(c) => c.id}
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
        renderItem={({ item }) => <FleetCarCard car={item} onPress={() => onViewCarDetails(item.id)} />}
        ListEmptyComponent={
          loading ? (
            <View>
              <Skeleton height={260} />
              <Skeleton height={260} />
            </View>
          ) : error ? (
            <EmptyState icon="wifi-off" title="Could not load your cars" body={error} action={<Button title="Try again" size="md" variant="secondary" onPress={load} />} />
          ) : cars.length === 0 ? (
            <EmptyState
              icon="truck"
              title="Add your first car"
              body="Add photos, prices and details. Escardia reviews each car before customers can book it."
              action={<Button title="Add a car" size="md" icon="plus" onPress={onAddCar} />}
            />
          ) : (
            <EmptyState
              icon="filter"
              title={filter === 'live' ? 'No live cars' : filter === 'review' ? 'Nothing in review' : 'No paused cars'}
              body={
                filter === 'live'
                  ? 'Cars go live once Escardia approves them.'
                  : filter === 'review'
                    ? 'New cars and cars you change show up here until they are approved.'
                    : 'Cars you pause for maintenance show up here.'
              }
            />
          )
        }
      />
      <VendorTabBar active="fleet" onNavigate={onTab} />
    </View>
  );
};

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: gutter, paddingTop: 16, paddingBottom: 14 },
}));

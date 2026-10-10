// Vendor earnings: balances, a simple chart of what completed trips earned, money on hold, and activity.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../config/supabase';
import { getVendorBookings, Booking } from '../services/bookingService';
import { getUserTransactions, getWalletBalances, Transaction } from '../services/walletService';
import { useAppSettings } from '../hooks/useAppSettings';
import { AppText, Button } from '../ui';
import { naira } from '../ui/CarCard';
import { TransactionRow } from '../ui/Status';
import { Segmented, Skeleton } from '../ui/Kit';
import { VendorTabBar, VendorTab, TAB_BAR_SPACE } from '../ui/TabBar';
import { brand, color, gutter, radius, themed, statusBarStyle } from '../theme';

interface VendorEarningsScreenProps {
  onTab: (tab: VendorTab) => void;
  onWithdraw: () => void;
  onOpenBooking: (bookingId: string) => void;
}

type Period = 'week' | 'month' | 'year';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const short = (n: number) => (n >= 1_000_000 ? `₦${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}m` : n >= 1000 ? `₦${Math.round(n / 1000)}k` : naira(n));
const when = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/** Completed trips count on the day they finished. */
const earnedOn = (b: Booking) => new Date(b.completedAt || b.endAt);

const buckets = (period: Period, trips: Booking[]) => {
  const now = new Date();
  if (period === 'week') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
      const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      return { label: DAYS[d.getDay()], total: trips.filter((t) => earnedOn(t) >= d && earnedOn(t) < next).reduce((n, t) => n + t.vendorAmount, 0) };
    });
  }
  if (period === 'month') {
    return Array.from({ length: 5 }, (_, i) => {
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1 - (4 - i) * 7);
      const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 7);
      return { label: i === 4 ? 'This wk' : `${start.getDate()} ${MONTHS[start.getMonth()]}`, total: trips.filter((t) => earnedOn(t) >= start && earnedOn(t) < end).reduce((n, t) => n + t.vendorAmount, 0) };
    });
  }
  return Array.from({ length: 12 }, (_, i) => {
    const start = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    return { label: MONTHS[start.getMonth()].slice(0, 1), total: trips.filter((t) => earnedOn(t) >= start && earnedOn(t) < end).reduce((n, t) => n + t.vendorAmount, 0) };
  });
};

export const VendorEarningsScreen: React.FC<VendorEarningsScreenProps> = ({ onTab, onWithdraw, onOpenBooking }) => {
  const insets = useSafeAreaInsets();
  const { settings } = useAppSettings();
  const [balances, setBalances] = useState({ available: 0, pending: 0 });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activity, setActivity] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState<Period>('month');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const id = auth.currentUser?.uid;
    if (!id) return setLoading(false);
    const [w, b, t] = await Promise.all([getWalletBalances(id), getVendorBookings(id), getUserTransactions(id, 30)]);
    setBalances(w);
    setBookings(b.bookings);
    setActivity(t.filter((x) => x.status === 'completed'));
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const completed = useMemo(() => bookings.filter((b) => b.bookingStatus === 'completed' || b.bookingStatus === 'resolved'), [bookings]);
  const onHold = useMemo(
    () => bookings.filter((b) => ['confirmed', 'ongoing', 'disputed'].includes(b.bookingStatus) || (b.bookingStatus === 'completed' && !b.releasedAt)),
    [bookings]
  );
  const bars = useMemo(() => buckets(period, completed), [period, completed]);
  const periodTotal = bars.reduce((n, x) => n + x.total, 0);
  const max = Math.max(...bars.map((x) => x.total), 1);
  const lifetime = completed.reduce((n, b) => n + b.vendorAmount, 0);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style={statusBarStyle()} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: TAB_BAR_SPACE + 10 }}
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
      >
        <View style={styles.header}>
          <AppText variant="title">Earnings</AppText>
          <AppText variant="small" color={color.muted}>
            After Escardia&apos;s {Math.round(settings.commissionRate * 1000) / 10}% commission
          </AppText>
        </View>

        <View style={styles.balance}>
          <View style={styles.glow} />
          <AppText variant="small" color={color.onDarkMuted}>
            Available to withdraw
          </AppText>
          <AppText variant="display" color="#FFFFFF" numberOfLines={1} adjustsFontSizeToFit>
            {naira(balances.available)}
          </AppText>
          <View style={styles.balanceRow}>
            <View style={{ flex: 1 }}>
              <AppText variant="small" color={color.onDarkMuted} style={{ fontSize: 12 }}>
                On hold
              </AppText>
              <AppText variant="subheading" color="#FFFFFF">
                {naira(balances.pending)}
              </AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="small" color={color.onDarkMuted} style={{ fontSize: 12 }}>
                Earned all time
              </AppText>
              <AppText variant="subheading" color="#FFFFFF">
                {naira(lifetime)}
              </AppText>
            </View>
          </View>
          <Button title="Withdraw to bank" variant="white" icon="arrow-up-right" onPress={onWithdraw} style={{ marginTop: 16 }} disabled={balances.available <= 0} />
        </View>

        {loading ? (
          <View style={{ marginTop: 20 }}>
            <Skeleton height={220} />
            <Skeleton height={160} />
          </View>
        ) : (
          <>
            {/* Chart */}
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <View>
                  <AppText variant="small" color={color.muted}>
                    {period === 'week' ? 'Last 7 days' : period === 'month' ? 'Last 5 weeks' : 'Last 12 months'}
                  </AppText>
                  <AppText variant="title">{naira(periodTotal)}</AppText>
                </View>
              </View>
              <Segmented
                options={[
                  { key: 'week', label: 'Week' },
                  { key: 'month', label: 'Month' },
                  { key: 'year', label: 'Year' },
                ]}
                value={period}
                onChange={setPeriod}
                style={{ marginTop: 14 }}
              />
              <View style={styles.chart}>
                {bars.map((x, i) => (
                  <View key={i} style={styles.barCol}>
                    <AppText variant="small" color={color.muted} style={styles.barValue} numberOfLines={1}>
                      {x.total ? short(x.total) : ''}
                    </AppText>
                    <View style={styles.barTrack}>
                      <View style={[styles.bar, { height: `${Math.max((x.total / max) * 100, x.total ? 6 : 0)}%` }, i === bars.length - 1 && { backgroundColor: color.primary }]} />
                    </View>
                    <AppText variant="small" color={color.muted} style={{ fontSize: 11, marginTop: 6 }} numberOfLines={1}>
                      {x.label}
                    </AppText>
                  </View>
                ))}
              </View>
              {periodTotal === 0 && (
                <AppText variant="small" color={color.muted} center style={{ marginTop: 6 }}>
                  No completed trips in this period yet.
                </AppText>
              )}
            </View>

            {/* On hold */}
            {onHold.length > 0 && (
              <>
                <AppText variant="heading" style={styles.h}>
                  On hold
                </AppText>
                <AppText variant="small" color={color.muted} style={{ marginTop: -6, marginBottom: 10 }}>
                  Paid by customers. Released {settings.payoutHoldHours} hours after each trip ends.
                </AppText>
                <View style={styles.list}>
                  {onHold.slice(0, 6).map((b, i) => (
                    <Pressable key={b.id} onPress={() => onOpenBooking(b.id)} style={[styles.holdRow, i < Math.min(onHold.length, 6) - 1 && styles.rowBorder]}>
                      <View style={[styles.holdIcon, b.bookingStatus === 'disputed' && { backgroundColor: color.dangerSoft }]}>
                        <Feather name={b.bookingStatus === 'disputed' ? 'pause' : 'clock'} size={15} color={b.bookingStatus === 'disputed' ? color.danger : color.warning} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <AppText variant="bodyMedium" numberOfLines={1}>
                          {b.car.brand} {b.car.model}
                        </AppText>
                        <AppText variant="small" color={color.muted} numberOfLines={1}>
                          {b.bookingStatus === 'disputed'
                            ? 'Paused: problem reported'
                            : b.releaseAt
                              ? `Available ${when(b.releaseAt)}`
                              : b.bookingStatus === 'ongoing'
                                ? 'Trip in progress'
                                : `Trip on ${b.startDate}`}
                        </AppText>
                      </View>
                      <AppText variant="bodyMedium">{naira(b.vendorAmount)}</AppText>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {/* Activity */}
            <AppText variant="heading" style={styles.h}>
              Activity
            </AppText>
            {activity.length === 0 ? (
              <View style={[styles.list, { padding: 16 }]}>
                <AppText variant="body" color={color.muted}>
                  Released earnings and withdrawals show up here.
                </AppText>
              </View>
            ) : (
              <View style={[styles.list, { paddingHorizontal: 14 }]}>
                {activity.map((t, i) => (
                  <TransactionRow
                    key={t.id}
                    title={t.category === 'withdrawal' ? 'Withdrawal' : t.category === 'refund' ? 'Withdrawal returned' : 'Trip earnings'}
                    subtitle={`${t.description} · ${when(t.createdAt)}`}
                    amount={t.amount}
                    credit={t.type === 'credit'}
                    last={i === activity.length - 1}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
      <VendorTabBar active="earnings" onNavigate={onTab} />
    </View>
  );
};

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  header: { paddingTop: 16, paddingBottom: 14 },
  balance: { padding: 18, borderRadius: radius.xl, backgroundColor: color.navy, overflow: 'hidden' },
  glow: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: brand[600], opacity: 0.35, top: -130, right: -90 },
  balanceRow: { flexDirection: 'row', gap: 12, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)' },
  card: { marginTop: 16, padding: 16, borderRadius: radius.xl, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 170, marginTop: 18 },
  barCol: { flex: 1, alignItems: 'center', height: '100%' },
  barValue: { fontSize: 9.5, marginBottom: 4, height: 13 },
  barTrack: { flex: 1, width: '72%', maxWidth: 34, justifyContent: 'flex-end', borderRadius: 8, backgroundColor: color.sunken, overflow: 'hidden' },
  bar: { width: '100%', borderRadius: 8, backgroundColor: brand[300] },
  h: { marginTop: 24, marginBottom: 12 },
  list: { backgroundColor: color.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: color.border, overflow: 'hidden' },
  holdRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: color.border },
  holdIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: color.warningSoft, alignItems: 'center', justifyContent: 'center' },
}));

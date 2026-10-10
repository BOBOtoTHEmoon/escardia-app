// Vendor home: balance, what needs attention, upcoming bookings and quick actions.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../config/supabase';
import { getVendorBookings, Booking } from '../services/bookingService';
import { getVendorCars, Car } from '../services/carservice';
import { getUnreadNotificationCount } from '../services/notificationService';
import { EMPTY_STATS, getVendorStats, getVendorStatus, VendorStats } from '../services/vendorService';
import { useAppSettings } from '../hooks/useAppSettings';
import { AppText, Button, IconName } from '../ui';
import { Avatar } from '../ui/Avatar';
import { naira } from '../ui/CarCard';
import { Skeleton, StatTile } from '../ui/Kit';
import { VendorBookingCard, needsDriver } from '../ui/VendorCards';
import { VendorTabBar, VendorTab, TAB_BAR_SPACE } from '../ui/TabBar';
import { brand, color, gutter, radius, shadow, themed } from '../theme';

interface VendorDashboardScreenProps {
  vendorName: string;
  logoUrl?: string | null;
  onTab: (tab: VendorTab) => void;
  onNavigateToBookingDetails: (bookingId: string) => void;
  onNavigateToCarDetail: (carId: string) => void;
  onNavigateToDrivers: () => void;
  onNavigateToNotifications: () => void;
  onNavigateToWithdrawFunds: () => void;
  onNavigateToBankDetails: () => void;
  onAddCar: () => void;
}

type Todo = { key: string; icon: IconName; tone: 'amber' | 'red' | 'blue'; title: string; body: string; onPress: () => void };

export const VendorDashboardScreen: React.FC<VendorDashboardScreenProps> = ({
  vendorName,
  logoUrl,
  onTab,
  onNavigateToBookingDetails,
  onNavigateToCarDetail,
  onNavigateToDrivers,
  onNavigateToNotifications,
  onNavigateToWithdrawFunds,
  onAddCar,
}) => {
  const insets = useSafeAreaInsets();
  const { settings } = useAppSettings();
  const [stats, setStats] = useState<VendorStats>(EMPTY_STATS);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [account, setAccount] = useState<{ status: string; reason: string | null } | null>(null);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const id = auth.currentUser?.uid;
    if (!id) return setLoading(false);
    const [s, b, c, st, n] = await Promise.all([
      getVendorStats(),
      getVendorBookings(id),
      getVendorCars(id),
      getVendorStatus(),
      getUnreadNotificationCount().catch(() => 0),
    ]);
    setStats(s);
    setBookings(b.bookings);
    setCars(c.cars ?? []);
    setAccount(st);
    setUnread(n);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const upcoming = useMemo(
    () =>
      bookings
        .filter((b) => b.bookingStatus === 'confirmed' || b.bookingStatus === 'ongoing')
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
    [bookings]
  );

  const todos = useMemo<Todo[]>(() => {
    const list: Todo[] = [];
    const noDriver = upcoming.filter(needsDriver);
    if (noDriver.length) {
      list.push({
        key: 'driver',
        icon: 'user-plus',
        tone: 'amber',
        title: noDriver.length === 1 ? 'Assign a driver' : `Assign drivers to ${noDriver.length} bookings`,
        body: `${noDriver[0].car.brand} ${noDriver[0].car.model}, ${noDriver[0].startDate} at ${noDriver[0].startTime}`,
        onPress: () => onNavigateToBookingDetails(noDriver[0].id),
      });
    }
    const disputed = bookings.filter((b) => b.bookingStatus === 'disputed');
    if (disputed.length) {
      list.push({
        key: 'dispute',
        icon: 'alert-triangle',
        tone: 'red',
        title: 'A customer reported a problem',
        body: `Trip ${disputed[0].code}. Your payout for it is paused while Escardia reviews it.`,
        onPress: () => onNavigateToBookingDetails(disputed[0].id),
      });
    }
    cars
      .filter((c) => c.approvalStatus === 'rejected')
      .slice(0, 2)
      .forEach((c) =>
        list.push({
          key: `car-${c.id}`,
          icon: 'edit-3',
          tone: 'red',
          title: `${c.brand} ${c.model} needs changes`,
          body: c.rejectionReason || 'Open the car to see what to fix.',
          onPress: () => onNavigateToCarDetail(c.id),
        })
      );
    return list;
  }, [upcoming, bookings, cars, onNavigateToBookingDetails, onNavigateToCarDetail]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE + 10 }}
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
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View style={styles.glow} />
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 }}>
              <Pressable onPress={() => onTab('profile')} accessibilityLabel="Your account">
                <Avatar uri={logoUrl} name={vendorName} size={44} />
              </Pressable>
              <View style={{ flexShrink: 1 }}>
                <AppText variant="small" color={color.onDarkMuted}>
                  {greeting}
                </AppText>
                <AppText variant="subheading" color="#FFFFFF" numberOfLines={1}>
                  {vendorName}
                </AppText>
              </View>
            </View>
            <Pressable onPress={onNavigateToNotifications} style={styles.bell} accessibilityLabel="Notifications">
              <Feather name="bell" size={18} color="#FFFFFF" />
              {unread > 0 && <View style={styles.bellDot} />}
            </Pressable>
          </View>

          <View style={styles.balance}>
            <AppText variant="small" color={color.onDarkMuted}>
              Available to withdraw
            </AppText>
            <AppText variant="display" color="#FFFFFF" style={{ marginTop: 2 }} numberOfLines={1} adjustsFontSizeToFit>
              {naira(stats.available)}
            </AppText>
            <View style={styles.balanceRow}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather name="clock" size={13} color={brand[200]} />
                  <AppText variant="smallMedium" color="#FFFFFF">
                    {naira(stats.pending)} on hold
                  </AppText>
                </View>
                <AppText variant="small" color={color.onDarkMuted} style={{ fontSize: 12, marginTop: 2 }}>
                  Released {settings.payoutHoldHours}h after trips
                </AppText>
              </View>
              <Button title="Withdraw" size="md" variant="white" icon="arrow-up-right" onPress={onNavigateToWithdrawFunds} style={{ paddingHorizontal: 18 }} />
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: gutter }}>
          {account && account.status !== 'approved' && <AccountBanner status={account.status} reason={account.reason} onAddCar={onAddCar} />}

          {loading ? (
            <View style={{ marginTop: 18 }}>
              <Skeleton height={96} />
              <Skeleton height={150} />
            </View>
          ) : (
            <>
              <View style={[styles.grid, { marginTop: 18 }]}>
                <StatTile
                  icon="truck"
                  label="Cars live"
                  value={`${stats.approvedCars} of ${stats.totalCars}`}
                  hint={stats.pendingCars ? `${stats.pendingCars} in review` : undefined}
                  tone="blue"
                  onPress={() => onTab('fleet')}
                />
                <StatTile icon="calendar" label="Active bookings" value={String(stats.activeBookings)} tone="green" onPress={() => onTab('bookings')} />
              </View>
              <View style={[styles.grid, { marginTop: 12 }]}>
                <StatTile icon="check-circle" label="Trips completed" value={String(stats.completedBookings)} tone="slate" onPress={() => onTab('bookings')} />
                <StatTile
                  icon="star"
                  label={stats.totalReviews ? `${stats.totalReviews} rating${stats.totalReviews === 1 ? '' : 's'}` : 'No ratings yet'}
                  value={stats.totalReviews ? stats.averageRating.toFixed(1) : 'New'}
                  tone="amber"
                />
              </View>

              {todos.length > 0 && (
                <>
                  <SectionHead title="Needs your attention" />
                  <View style={styles.todoCard}>
                    {todos.map((t, i) => (
                      <Pressable key={t.key} onPress={t.onPress} style={({ pressed }) => [styles.todo, i < todos.length - 1 && styles.todoBorder, pressed && { backgroundColor: color.sunken }]}>
                        <View style={[styles.todoIcon, { backgroundColor: t.tone === 'amber' ? color.warningSoft : t.tone === 'red' ? color.dangerSoft : color.primarySoft }]}>
                          <Feather name={t.icon} size={16} color={t.tone === 'amber' ? color.warning : t.tone === 'red' ? color.danger : color.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <AppText variant="bodyMedium">{t.title}</AppText>
                          <AppText variant="small" color={color.muted} numberOfLines={2}>
                            {t.body}
                          </AppText>
                        </View>
                        <Feather name="chevron-right" size={18} color={color.subtle} />
                      </Pressable>
                    ))}
                  </View>
                </>
              )}

              <SectionHead title="Coming up" action={upcoming.length ? 'All bookings' : undefined} onAction={() => onTab('bookings')} />
              {upcoming.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Feather name="calendar" size={20} color={color.primary} />
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyMedium">No upcoming bookings</AppText>
                    <AppText variant="small" color={color.muted}>
                      {stats.approvedCars ? 'New bookings show up here as soon as a customer pays.' : 'Once a car is approved, customers can book it.'}
                    </AppText>
                  </View>
                </View>
              ) : (
                upcoming.slice(0, 3).map((b) => <VendorBookingCard key={b.id} booking={b} onPress={() => onNavigateToBookingDetails(b.id)} />)
              )}

              <SectionHead title="Quick actions" />
              <View style={styles.grid}>
                <Action icon="plus" label="Add a car" onPress={onAddCar} />
                <Action icon="users" label="Drivers" onPress={onNavigateToDrivers} />
                <Action icon="bar-chart-2" label="Earnings" onPress={() => onTab('earnings')} />
              </View>
            </>
          )}
        </View>
      </ScrollView>
      <VendorTabBar active="dashboard" onNavigate={onTab} />
    </View>
  );
};

const SectionHead = ({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) => (
  <View style={styles.sectionHead}>
    <AppText variant="heading">{title}</AppText>
    {!!action && (
      <Pressable onPress={onAction} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        <AppText variant="smallMedium" color={color.primary} style={{ fontSize: 14 }}>
          {action}
        </AppText>
        <Feather name="chevron-right" size={16} color={color.primary} />
      </Pressable>
    )}
  </View>
);

const Action = ({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.action, shadow.sm, pressed && { opacity: 0.9 }]}>
    <View style={styles.actionIcon}>
      <Feather name={icon} size={18} color={color.primary} />
    </View>
    <AppText variant="smallMedium" center style={{ marginTop: 8 }}>
      {label}
    </AppText>
  </Pressable>
);

const AccountBanner = ({ status, reason, onAddCar }: { status: string; reason: string | null; onAddCar: () => void }) => {
  const t =
    status === 'pending'
      ? {
          icon: 'clock' as IconName,
          bg: color.warningSoft,
          fg: color.warning,
          title: 'Your account is in review',
          body: 'Escardia is checking your details. You can add cars now; they go live once you are approved.',
        }
      : status === 'rejected'
        ? {
            icon: 'x-circle' as IconName,
            bg: color.dangerSoft,
            fg: color.danger,
            title: 'Your application was not approved',
            body: reason || 'Contact support to find out what to change.',
          }
        : {
            icon: 'slash' as IconName,
            bg: color.dangerSoft,
            fg: color.danger,
            title: 'Your account is suspended',
            body: reason || 'Your cars are hidden from customers. Contact support for help.',
          };
  return (
    <View style={[styles.account, { backgroundColor: t.bg }]}>
      <Feather name={t.icon} size={18} color={t.fg} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <AppText variant="bodyMedium" color={t.fg}>
          {t.title}
        </AppText>
        <AppText variant="small" color={color.text} style={{ marginTop: 2 }}>
          {t.body}
        </AppText>
        {status === 'pending' && (
          <Pressable onPress={onAddCar} hitSlop={6} style={{ marginTop: 8 }}>
            <AppText variant="smallMedium" color={color.primary}>
              Add a car
            </AppText>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  header: {
    backgroundColor: color.navy,
    paddingHorizontal: gutter,
    paddingBottom: 22,
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
    overflow: 'hidden',
  },
  glow: { position: 'absolute', width: 320, height: 320, borderRadius: 160, backgroundColor: brand[600], opacity: 0.3, top: -150, right: -110 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  bell: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: { position: 'absolute', top: 10, right: 11, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: color.navy },
  balance: {
    marginTop: 22,
    padding: 16,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)' },
  grid: { flexDirection: 'row', gap: 12 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, marginBottom: 12 },
  todoCard: { backgroundColor: color.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: color.border, overflow: 'hidden' },
  todo: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  todoBorder: { borderBottomWidth: 1, borderBottomColor: color.border },
  todoIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  emptyCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: radius.xl, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border },
  action: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: radius.xl, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border },
  actionIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: color.primarySoft, alignItems: 'center', justifyContent: 'center' },
  account: { flexDirection: 'row', gap: 12, marginTop: 18, padding: 14, borderRadius: radius.xl },
}));

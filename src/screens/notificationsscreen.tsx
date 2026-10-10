import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, SectionList, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppNotification, getMyNotifications, markAllNotificationsRead, markNotificationRead } from '../services/notificationService';
import { AppText, IconName, Screen, ScreenHeader } from '../ui';
import { color, gutter, radius, themed, statusBarStyle } from '../theme';

interface NotificationsScreenProps {
  onNavigateBack: () => void;
  userType?: 'user' | 'vendor';
  /** Opens the booking a notification is about, when there is one. */
  onOpenBooking?: (bookingId: string) => void;
}

const LOOK: Record<AppNotification['type'], { icon: IconName; bg: string; fg: string }> = themed(() => ({
  booking: { icon: 'calendar', bg: color.primarySoft, fg: color.primary },
  payment: { icon: 'credit-card', bg: color.successSoft, fg: color.success },
  withdrawal: { icon: 'send', bg: color.violetSoft, fg: color.violet },
  cancellation: { icon: 'x-circle', bg: color.dangerSoft, fg: color.danger },
  approval: { icon: 'check-circle', bg: color.successSoft, fg: color.success },
  general: { icon: 'bell', bg: color.sunken, fg: color.text },
}));

const ago = (d: Date) => {
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const group = (d: Date) => {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (d.toDateString() === today) return 'Today';
  if (d.toDateString() === yesterday) return 'Yesterday';
  return 'Earlier';
};

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onNavigateBack, onOpenBooking }) => {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setItems(await getMyNotifications(80));
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unread = items.filter((n) => !n.read).length;
  const sections = useMemo(() => {
    const out: { title: string; data: AppNotification[] }[] = [];
    items.forEach((n) => {
      const t = group(n.createdAt);
      const g = out.find((x) => x.title === t);
      if (g) g.data.push(n);
      else out.push({ title: t, data: [n] });
    });
    return out;
  }, [items]);

  const open = async (n: AppNotification) => {
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      markNotificationRead(n.id);
    }
    if (n.bookingId && onOpenBooking) onOpenBooking(n.bookingId);
  };

  const readAll = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    await markAllNotificationsRead();
  };

  return (
    <Screen>
      <StatusBar style={statusBarStyle()} />
      <ScreenHeader
        title="Notifications"
        subtitle={unread ? `${unread} unread` : undefined}
        onBack={onNavigateBack}
        right={
          unread > 0 ? (
            <Pressable onPress={readAll} hitSlop={8} style={styles.readAll}>
              <Feather name="check" size={14} color={color.primary} />
              <AppText variant="smallMedium" color={color.primary}>
                Mark all read
              </AppText>
            </Pressable>
          ) : undefined
        }
      />
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={color.primary} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(n) => n.id}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: insets.bottom + 32, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }
          renderSectionHeader={({ section }) => (
            <AppText variant="caption" color={color.muted} style={{ marginTop: 16, marginBottom: 8 }}>
              {section.title}
            </AppText>
          )}
          renderItem={({ item: n }) => {
            const look = LOOK[n.type] ?? LOOK.general;
            return (
              <Pressable onPress={() => open(n)} style={[styles.item, !n.read && styles.itemUnread]}>
                <View style={[styles.icon, { backgroundColor: look.bg }]}>
                  <Feather name={look.icon} size={17} color={look.fg} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                    <AppText variant={n.read ? 'body' : 'bodyMedium'} style={{ flex: 1 }}>
                      {n.title}
                    </AppText>
                    <AppText variant="small" color={color.subtle} style={{ fontSize: 12 }}>
                      {ago(n.createdAt)}
                    </AppText>
                  </View>
                  {!!n.message && (
                    <AppText variant="small" color={color.muted} style={{ marginTop: 2 }}>
                      {n.message}
                    </AppText>
                  )}
                </View>
                {!n.read ? <View style={styles.dot} /> : n.bookingId && onOpenBooking ? <Feather name="chevron-right" size={16} color={color.subtle} style={{ marginTop: 2 }} /> : null}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Feather name="bell" size={24} color={color.primary} />
              </View>
              <AppText variant="heading" style={{ marginTop: 16 }}>
                You&apos;re all caught up
              </AppText>
              <AppText variant="body" color={color.muted} center style={{ marginTop: 6 }}>
                Booking updates, payments and refunds will show up here.
              </AppText>
            </View>
          }
        />
      )}
    </Screen>
  );
};

const styles = themed(() => StyleSheet.create({
  readAll: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 32, borderRadius: 16, backgroundColor: color.primarySoft },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    marginBottom: 8,
    borderRadius: radius.lg,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  itemUnread: { borderColor: color.primaryLine, backgroundColor: color.highlight },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: color.primary, marginTop: 6 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 60 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: color.primarySoft, alignItems: 'center', justifyContent: 'center' },
}));

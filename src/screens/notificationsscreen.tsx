// src/screens/notificationsscreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../constants';
import {
  fetchNotifications,
  markNotificationAsRead,
  setupNotifications,
  sendTestPushInApp,
  Notification,
} from '../services/notificationservice';

interface NotificationsScreenProps {
  onNavigateBack: () => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  onNavigateBack,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await setupNotifications(); // Gets token
      await loadNotifications();
    };
    init();
  }, []);

  const loadNotifications = async () => {
    try {
      const list = await fetchNotifications();
      setNotifications(list);
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const icon = (type: string) => {
    switch (type) {
      case 'booking': return 'Calendar';
      case 'payment': return 'Money';
      case 'cancellation': return 'Cross';
      default: return 'Bell';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backIcon}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* TEST BUTTON (REMOVE LATER) */}
      <TouchableOpacity onPress={sendTestPushInApp} style={styles.testButton}>
        <Text style={styles.testText}>SEND TEST PUSH</Text>
      </TouchableOpacity>

      <ScrollView style={styles.scrollView}>
        {loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Loading...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>Bell</Text>
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyText}>You're all caught up!</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {notifications.map((n) => (
              <TouchableOpacity
                key={n.id}
                style={[styles.card, !n.read && styles.unread]}
                onPress={() => markRead(n.id)}
              >
                <View style={styles.icon}>
                  <Text style={styles.iconText}>{icon(n.type)}</Text>
                </View>
                <View style={styles.content}>
                  <Text style={styles.title}>{n.title}</Text>
                  <Text style={styles.message}>{n.message}</Text>
                  <Text style={styles.time}>
                    {new Date(n.timestamp).toLocaleString()}
                  </Text>
                </View>
                {!n.read && <View style={styles.dot} />}
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={styles.bottom} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
  },
  backButton: { padding: spacing.sm },
  backIcon: { fontSize: 24, color: colors.text },
  headerTitle: { fontSize: typography.fontSize.xl, fontWeight: 'bold', color: colors.text },
  headerSpacer: { width: 40 },
  testButton: { padding: 10, backgroundColor: '#ff3b30', alignItems: 'center' },
  testText: { color: 'white', fontWeight: 'bold' },
  scrollView: { flex: 1 },
  empty: { alignItems: 'center', paddingVertical: spacing['3xl'] },
  emptyIcon: { fontSize: 80, marginBottom: spacing.md },
  emptyTitle: { fontSize: typography.fontSize.xl, fontWeight: 'bold', color: colors.text, marginBottom: spacing.xs },
  emptyText: { fontSize: typography.fontSize.base, color: colors.textSecondary },
  list: { padding: spacing.lg },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    position: 'relative',
  },
  unread: { backgroundColor: colors.primary + '10' },
  icon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  iconText: { fontSize: 20 },
  content: { flex: 1 },
  title: { fontSize: typography.fontSize.base, fontWeight: '600', color: colors.text, marginBottom: 4 },
  message: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginBottom: 4 },
  time: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  dot: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  bottom: { height: 40 },
});
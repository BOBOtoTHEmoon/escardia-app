// ============================================
// ESCARDIA - NOTIFICATIONS SCREEN (Updated)
// File: src/screens/NotificationsScreen.tsx
// ============================================
// Reads from:
// 1. Bookings collection (booking updates)
// 2. Notifications collection (payments, withdrawals, etc.)
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../constants';
import { auth, db } from '../config/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  updateDoc,
  limit,
  Timestamp,
} from 'firebase/firestore';

interface NotificationsScreenProps {
  onNavigateBack: () => void;
  userType?: 'user' | 'vendor'; // Support both user and vendor
}

interface Notification {
  id: string;
  type: 'booking' | 'payment' | 'withdrawal' | 'cancellation' | 'approval' | 'general';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  source: 'booking' | 'notification'; // Where it came from
  bookingId?: string;
  createdAt: Date;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  onNavigateBack,
  userType = 'vendor',
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Format timestamp to relative time
  const formatTimestamp = (date: Date): string => {
    try {
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      });
    } catch (e) {
      return 'Recently';
    }
  };

  // Convert Firestore timestamp to Date
  const toDate = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (timestamp.toDate) return timestamp.toDate();
    if (timestamp instanceof Date) return timestamp;
    return new Date(timestamp);
  };

  // Fetch all notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        setLoading(false);
        return;
      }

      const allNotifications: Notification[] = [];

      // ============================================
      // 1. FETCH FROM NOTIFICATIONS COLLECTION
      // ============================================
      try {
        const notificationsQuery = query(
          collection(db, 'notifications'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(50)
        );

        const notifSnapshot = await getDocs(notificationsQuery);

        notifSnapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const createdAt = toDate(data.createdAt);

          // Determine type from notification data
          let type: Notification['type'] = 'general';
          if (data.type?.includes('PAYMENT') || data.type?.includes('payment')) {
            type = 'payment';
          } else if (data.type?.includes('BOOKING') || data.type?.includes('booking')) {
            type = 'booking';
          } else if (data.type?.includes('WITHDRAWAL') || data.type?.includes('withdrawal')) {
            type = 'withdrawal';
          } else if (data.type?.includes('APPROVAL') || data.type?.includes('approval')) {
            type = 'approval';
          } else if (data.type?.includes('CANCEL') || data.type?.includes('cancel')) {
            type = 'cancellation';
          }

          allNotifications.push({
            id: docSnap.id,
            type,
            title: data.title || 'Notification',
            message: data.body || data.message || '',
            timestamp: formatTimestamp(createdAt),
            read: data.read || false,
            source: 'notification',
            bookingId: data.data?.bookingId,
            createdAt,
          });
        });

        console.log(`✅ Loaded ${notifSnapshot.docs.length} from notifications collection`);
      } catch (error: any) {
        // Index might not exist, that's okay
        console.log('Note: notifications query failed (index may be needed):', error.message);
      }

      // ============================================
      // 2. FETCH FROM BOOKINGS COLLECTION
      // ============================================
      try {
        const bookingField = userType === 'vendor' ? 'vendorId' : 'userId';
        
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where(bookingField, '==', userId),
          orderBy('createdAt', 'desc'),
          limit(30)
        );

        const bookingsSnapshot = await getDocs(bookingsQuery);

        for (const docSnap of bookingsSnapshot.docs) {
          const booking = docSnap.data();
          const createdAt = toDate(booking.createdAt);

          // Skip if we already have a notification for this booking
          const existingNotif = allNotifications.find(n => n.bookingId === docSnap.id);
          if (existingNotif) continue;

          // Get car name
          let carName = 'your car';
          if (booking.car) {
            carName = `${booking.car.brand || ''} ${booking.car.model || ''}`.trim() || 'your car';
          } else if (booking.carBrand && booking.carModel) {
            carName = `${booking.carBrand} ${booking.carModel}`;
          }

          // Get customer name (for vendors)
          let customerName = booking.customerName || 'A customer';

          // Generate notification based on status
          let title = '';
          let message = '';
          let type: Notification['type'] = 'booking';

          if (userType === 'vendor') {
            // Vendor notifications
            switch (booking.status) {
              case 'pending':
                title = '📅 New Booking Request';
                message = `${customerName} wants to book ${carName}`;
                break;
              case 'confirmed':
                title = '✅ Booking Confirmed';
                message = `Booking for ${carName} is confirmed`;
                break;
              case 'ongoing':
                title = '🚗 Trip Started';
                message = `${customerName} started their trip with ${carName}`;
                break;
              case 'completed':
              case 'past':
                title = '🏁 Trip Completed';
                message = `${customerName} completed their trip. Earnings: ₦${((booking.totalPrice || 0) * 0.9).toLocaleString()}`;
                type = 'payment';
                break;
              case 'cancelled':
                title = '❌ Booking Cancelled';
                message = `${customerName} cancelled the booking for ${carName}`;
                type = 'cancellation';
                break;
              default:
                title = '🔔 Booking Update';
                message = `Update on ${carName} booking`;
            }
          } else {
            // User notifications
            switch (booking.status) {
              case 'pending':
                title = '⏳ Booking Pending';
                message = `Your booking for ${carName} is awaiting confirmation`;
                break;
              case 'confirmed':
                title = '✅ Booking Confirmed!';
                message = `Your booking for ${carName} has been confirmed`;
                break;
              case 'ongoing':
                title = '🚗 Trip In Progress';
                message = `Enjoy your trip with ${carName}!`;
                break;
              case 'completed':
              case 'past':
                title = '🏁 Trip Completed';
                message = `Thanks for riding with ${carName}!`;
                break;
              case 'cancelled':
                title = '❌ Booking Cancelled';
                message = `Your booking for ${carName} was cancelled`;
                type = 'cancellation';
                break;
              default:
                title = '🔔 Booking Update';
                message = `Update on your ${carName} booking`;
            }
          }

          allNotifications.push({
            id: `booking-${docSnap.id}`,
            type,
            title,
            message,
            timestamp: formatTimestamp(createdAt),
            read: booking.notificationRead || false,
            source: 'booking',
            bookingId: docSnap.id,
            createdAt,
          });
        }

        console.log(`✅ Loaded ${bookingsSnapshot.docs.length} from bookings collection`);
      } catch (error: any) {
        console.log('Note: bookings query failed:', error.message);
      }

      // ============================================
      // 3. FETCH WITHDRAWAL NOTIFICATIONS (Vendors)
      // ============================================
      if (userType === 'vendor') {
        try {
          const withdrawalsQuery = query(
            collection(db, 'withdrawals'),
            where('vendorId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(10)
          );

          const withdrawalsSnapshot = await getDocs(withdrawalsQuery);

          withdrawalsSnapshot.docs.forEach((docSnap) => {
            const withdrawal = docSnap.data();
            const createdAt = toDate(withdrawal.createdAt);

            let title = '';
            let message = '';

            switch (withdrawal.status) {
              case 'success':
                title = '💰 Withdrawal Successful';
                message = `₦${(withdrawal.amount || 0).toLocaleString()} sent to your bank account`;
                break;
              case 'processing':
                title = '⏳ Withdrawal Processing';
                message = `₦${(withdrawal.amount || 0).toLocaleString()} is being processed`;
                break;
              case 'failed':
                title = '❌ Withdrawal Failed';
                message = `₦${(withdrawal.amount || 0).toLocaleString()} withdrawal failed. Amount refunded to wallet.`;
                break;
              default:
                title = '💸 Withdrawal Update';
                message = `Update on your ₦${(withdrawal.amount || 0).toLocaleString()} withdrawal`;
            }

            allNotifications.push({
              id: `withdrawal-${docSnap.id}`,
              type: 'withdrawal',
              title,
              message,
              timestamp: formatTimestamp(createdAt),
              read: withdrawal.notificationRead || false,
              source: 'notification',
              createdAt,
            });
          });

          console.log(`✅ Loaded ${withdrawalsSnapshot.docs.length} withdrawals`);
        } catch (error: any) {
          console.log('Note: withdrawals query failed:', error.message);
        }
      }

      // ============================================
      // 4. FETCH TRANSACTION NOTIFICATIONS (Wallet)
      // ============================================
      try {
        const transactionsQuery = query(
          collection(db, 'transactions'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(10)
        );

        const transactionsSnapshot = await getDocs(transactionsQuery);

        transactionsSnapshot.docs.forEach((docSnap) => {
          const txn = docSnap.data();
          const createdAt = toDate(txn.createdAt);

          // Only show wallet funding and booking payments
          if (txn.category === 'wallet_funding' || txn.category === 'booking_payment') {
            let title = '';
            let message = '';

            if (txn.category === 'wallet_funding') {
              title = '💳 Wallet Funded';
              message = `₦${(txn.amount || 0).toLocaleString()} added to your wallet`;
            } else if (txn.category === 'booking_payment' && txn.type === 'credit') {
              title = '💰 Payment Received';
              message = `₦${(txn.amount || 0).toLocaleString()} credited for ${txn.description || 'booking'}`;
            }

            if (title) {
              allNotifications.push({
                id: `txn-${docSnap.id}`,
                type: 'payment',
                title,
                message,
                timestamp: formatTimestamp(createdAt),
                read: txn.notificationRead || false,
                source: 'notification',
                createdAt,
              });
            }
          }
        });
      } catch (error: any) {
        console.log('Note: transactions query failed:', error.message);
      }

      // ============================================
      // SORT ALL BY DATE (newest first)
      // ============================================
      allNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Remove duplicates (keep first occurrence)
      const uniqueNotifications = allNotifications.filter(
        (notif, index, self) =>
          index === self.findIndex(n => n.title === notif.title && n.message === notif.message)
      );

      setNotifications(uniqueNotifications);
      console.log(`✅ Total notifications: ${uniqueNotifications.length}`);
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userType]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  // Mark notification as read
  const markAsRead = async (notification: Notification) => {
    try {
      if (notification.read) return;

      if (notification.source === 'booking' && notification.bookingId) {
        await updateDoc(doc(db, 'bookings', notification.bookingId), {
          notificationRead: true,
        });
      } else if (notification.source === 'notification') {
        const realId = notification.id.replace('withdrawal-', '').replace('txn-', '');
        
        if (notification.id.startsWith('withdrawal-')) {
          await updateDoc(doc(db, 'withdrawals', realId), {
            notificationRead: true,
          });
        } else if (notification.id.startsWith('txn-')) {
          await updateDoc(doc(db, 'transactions', realId), {
            notificationRead: true,
          });
        } else {
          await updateDoc(doc(db, 'notifications', notification.id), {
            read: true,
          });
        }
      }

      setNotifications(notifications.map(n =>
        n.id === notification.id ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      for (const notif of unreadNotifications) {
        await markAsRead(notif);
      }

      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'booking': return '📅';
      case 'payment': return '💰';
      case 'withdrawal': return '💸';
      case 'cancellation': return '❌';
      case 'approval': return '✅';
      default: return '🔔';
    }
  };

  // Get background color for notification type
  const getIconBackground = (type: Notification['type']) => {
    switch (type) {
      case 'booking': return '#3B82F6' + '20';
      case 'payment': return '#10B981' + '20';
      case 'withdrawal': return '#8B5CF6' + '20';
      case 'cancellation': return '#EF4444' + '20';
      case 'approval': return '#10B981' + '20';
      default: return '#6B7280' + '20';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Mark all</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {/* Unread count badge */}
      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Text style={styles.unreadBannerText}>
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyText}>You're all caught up!</Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.read && styles.notificationUnread,
                ]}
                onPress={() => markAsRead(notification)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.notificationIcon,
                  { backgroundColor: getIconBackground(notification.type) }
                ]}>
                  <Text style={styles.notificationIconText}>
                    {getNotificationIcon(notification.type)}
                  </Text>
                </View>
                <View style={styles.notificationContent}>
                  <Text style={[
                    styles.notificationTitle,
                    !notification.read && styles.notificationTitleUnread
                  ]}>
                    {notification.title}
                  </Text>
                  <Text style={styles.notificationMessage} numberOfLines={2}>
                    {notification.message}
                  </Text>
                  <Text style={styles.notificationTime}>{notification.timestamp}</Text>
                </View>
                {!notification.read && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  backIcon: {
    fontSize: 24,
    color: colors.text,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  headerSpacer: {
    width: 60,
  },
  markAllButton: {
    padding: spacing.sm,
  },
  markAllText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.semiBold,
  },
  unreadBanner: {
    backgroundColor: colors.primary + '15',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  unreadBannerText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  notificationsList: {
    padding: spacing.lg,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  notificationUnread: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  notificationIconText: {
    fontSize: 22,
  },
  notificationContent: {
    flex: 1,
    paddingRight: spacing.md,
  },
  notificationTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: 4,
  },
  notificationTitleUnread: {
    fontWeight: typography.fontWeight.bold,
  },
  notificationMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 6,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: typography.fontSize.xs,
    color: '#9CA3AF',
  },
  unreadDot: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default NotificationsScreen;
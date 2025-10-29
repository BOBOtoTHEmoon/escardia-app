import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../constants';

interface NotificationsScreenProps {
  onNavigateBack: () => void;
}

interface Notification {
  id: string;
  type: 'booking' | 'payment' | 'cancellation' | 'general';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  bookingId?: string;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  onNavigateBack,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { auth, db } = await import('../config/firebase');
      const { collection, query, where, getDocs, orderBy } = await import('firebase/firestore');
      
      const vendorId = auth.currentUser?.uid;
      if (!vendorId) {
        setLoading(false);
        return;
      }

      // Fetch bookings to generate notifications
      const q = query(
        collection(db, 'bookings'),
        where('vendorId', '==', vendorId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      // Convert bookings to notifications
      const notifsList: Notification[] = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const booking = docSnap.data();
          
          // Fetch user name
          const userQuery = query(collection(db, 'users'), where('__name__', '==', booking.userId));
          const userSnapshot = await getDocs(userQuery);
          const userData = userSnapshot.docs[0]?.data();
          const userName = userData ? `${userData.firstName} ${userData.lastName}` : 'A customer';
          
          // Fetch car name
          const carQuery = query(collection(db, 'cars'), where('__name__', '==', booking.carId));
          const carSnapshot = await getDocs(carQuery);
          const carData = carSnapshot.docs[0]?.data();
          const carName = carData ? `${carData.brand} ${carData.model}` : 'your car';

          // Generate notification based on booking status
          let title = '';
          let message = '';
          let type: 'booking' | 'payment' | 'cancellation' | 'general' = 'booking';

          switch (booking.status) {
            case 'pending':
              title = 'New Booking Request';
              message = `${userName} requested to book ${carName}`;
              type = 'booking';
              break;
            case 'confirmed':
              title = 'Booking Confirmed';
              message = `${userName}'s booking for ${carName} has been confirmed`;
              type = 'booking';
              break;
            case 'ongoing':
              title = 'Trip Started';
              message = `${userName} started their trip with ${carName}`;
              type = 'booking';
              break;
            case 'completed':
              title = 'Trip Completed';
              message = `${userName} completed their trip with ${carName}`;
              type = 'payment';
              break;
            case 'cancelled':
              title = 'Booking Cancelled';
              message = `${userName} cancelled their booking for ${carName}`;
              type = 'cancellation';
              break;
            default:
              title = 'Booking Update';
              message = `Update on ${carName} booking`;
              type = 'general';
          }

          // Format timestamp
          let timestamp = 'Just now';
          try {
            let date;
            if (booking.createdAt?.toDate) {
              date = booking.createdAt.toDate();
            } else {
              date = new Date(booking.createdAt);
            }
            
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) {
              timestamp = 'Just now';
            } else if (diffMins < 60) {
              timestamp = `${diffMins}m ago`;
            } else if (diffHours < 24) {
              timestamp = `${diffHours}h ago`;
            } else if (diffDays < 7) {
              timestamp = `${diffDays}d ago`;
            } else {
              timestamp = date.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
              });
            }
          } catch (e) {
            timestamp = 'Recently';
          }

          return {
            id: docSnap.id,
            type,
            title,
            message,
            timestamp,
            read: booking.notificationRead || false,
            bookingId: docSnap.id,
          };
        })
      );

      setNotifications(notifsList);
      console.log(`✅ Loaded ${notifsList.length} notifications`);
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { db } = await import('../config/firebase');
      const { doc, updateDoc } = await import('firebase/firestore');

      await updateDoc(doc(db, 'bookings', notificationId), {
        notificationRead: true,
      });

      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking': return '📅';
      case 'payment': return '💰';
      case 'cancellation': return '❌';
      default: return '🔔';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Loading...</Text>
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
                onPress={() => markAsRead(notification.id)}
              >
                <View style={styles.notificationIcon}>
                  <Text style={styles.notificationIconText}>
                    {getNotificationIcon(notification.type)}
                  </Text>
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationMessage}>{notification.message}</Text>
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
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
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
    width: 40,
  },
  scrollView: {
    flex: 1,
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
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    position: 'relative',
  },
  notificationUnread: {
    backgroundColor: colors.primary + '10',
  },
  notificationIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  notificationIconText: {
    fontSize: 20,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  unreadDot: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  bottomSpacing: {
    height: 40,
  },
});
// src/services/notificationservice.ts
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import { db, auth } from '../config/firebase';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
} from 'firebase/firestore';

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  newBookings: boolean;
  bookingUpdates: boolean;
  cancellations: boolean;
  payments: boolean;
  withdrawals: boolean;
  promotions: boolean;
  tips: boolean;
}

export interface Notification {
  id: string;
  type: 'booking' | 'payment' | 'cancellation' | 'general' | 'withdrawal';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  bookingId?: string;
}

// Setup push notifications (called once on app open)
export async function setupNotifications(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return null;

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please allow notifications');
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Push token:', token);

    const user = auth.currentUser;
    if (user) {
      await updateDoc(doc(db, 'vendors', user.uid), {
        pushToken: token,
        updatedAt: new Date().toISOString(),
      });
    }

    return token;
  } catch (error) {
    console.error('Error setting up notifications:', error);
    return null;
  }
}

// Save preferences
export async function saveNotificationPreferences(preferences: NotificationPreferences): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  await updateDoc(doc(db, 'vendors', user.uid), {
    notificationPreferences: preferences,
    updatedAt: new Date().toISOString(),
  });
}

// Get preferences
export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  const user = auth.currentUser;
  if (!user) return null;

  const docSnap = await getDoc(doc(db, 'vendors', user.uid));
  if (!docSnap.exists()) return null;

  return docSnap.data()?.notificationPreferences || null;
}

// Send push notification (manual or backend)
export async function sendPushNotification(
  pushToken: string,
  title: string,
  message: string,
  data?: { [key: string]: string }
): Promise<void> {
  const payload = {
    to: pushToken,
    sound: 'default',
    title,
    body: message,
    data: data || {},
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

// Store in-app notification
export async function storeNotification(
  notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  await addDoc(collection(db, 'notifications'), {
    vendorId: user.uid,
    ...notification,
    timestamp: new Date().toISOString(),
    read: false,
  });
}

// Fetch in-app notifications
export async function fetchNotifications(): Promise<Notification[]> {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(
    collection(db, 'notifications'),
    where('vendorId', '==', user.uid),
    orderBy('timestamp', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as Notification));
}

// Mark as read
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await updateDoc(doc(db, 'notifications', notificationId), {
    read: true,
  });
}

// MANUAL PUSH TEST (IN-APP BUTTON)
export async function sendTestPushInApp() {
  const user = auth.currentUser;
  if (!user) {
    Alert.alert('Error', 'Not logged in');
    return;
  }

  const docSnap = await getDoc(doc(db, 'vendors', user.uid));
  const pushToken = docSnap.data()?.pushToken;

  if (!pushToken) {
    Alert.alert('No Token', 'Open app first to get push token');
    return;
  }

  await sendPushNotification(
    pushToken,
    'Test Alert',
    'Push notifications are working!',
    { type: 'test' }
  );

  await storeNotification({
    type: 'general',
    title: 'Test Alert',
    message: 'This is a test from your app',
  });

  Alert.alert('Sent!', 'Check your phone and in-app bell');
}
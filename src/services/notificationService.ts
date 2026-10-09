import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,    
    shouldPlaySound: true,    
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,     
  }),
});


export const registerForPushNotifications = async (): Promise<string | null> => {
  try {
    // Must be a physical device (not simulator)
    if (!Device.isDevice) {
      console.log('⚠️ Push notifications only work on physical devices');
      return null;
    }

    // Check existing permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // If not granted, ask for permission
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // If still not granted, user denied
    if (finalStatus !== 'granted') {
      console.log('❌ Push notification permission denied');
      return null;
    }

    // Get the Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '778aa0c7-92ea-41d1-a06f-60f0b2fb15eb', 
    });

    const pushToken = tokenData.data;
    console.log('✅ Push token:', pushToken);

    // Android needs a notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3B82F6',
      });
    }

    return pushToken;
  } catch (error) {
    console.error('❌ Error getting push token:', error);
    return null;
  }
};


export const savePushToken = async (
  userId: string,
  userType: 'user' | 'vendor' | 'admin'
): Promise<boolean> => {
  try {
    const pushToken = await registerForPushNotifications();
    
    if (!pushToken) {
      console.log('⚠️ No push token to save');
      return false;
    }

    // Save on the user's profile. The server reads it when sending notifications.
    const { error } = await supabase.from('profiles').update({ push_token: pushToken }).eq('id', userId);
    if (error) throw error;

    console.log(`✅ Push token saved for ${userType}: ${userId}`);
    return true;
  } catch (error) {
    console.error('❌ Error saving push token:', error);
    return false;
  }
};


export const addNotificationReceivedListener = (
  callback: (notification: Notifications.Notification) => void
) => {
  return Notifications.addNotificationReceivedListener(callback);
};

// When user TAPS on notification
export const addNotificationResponseListener = (
  callback: (response: Notifications.NotificationResponse) => void
) => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};

export const sendLocalNotification = async (
  title: string,
  body: string,
  data?: Record<string, any>
) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: true,
    },
    trigger: null, // Send immediately
  });
};


export const getNotificationPermissionStatus = async (): Promise<string> => {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
};

export const clearAllNotifications = async () => {
  await Notifications.dismissAllNotificationsAsync();
};

export const getBadgeCount = async (): Promise<number> => {
  return await Notifications.getBadgeCountAsync();
};

export const setBadgeCount = async (count: number) => {
  await Notifications.setBadgeCountAsync(count);
};
// ---------------- In-app notifications (created by the server) ----------------

export interface AppNotification {
  id: string;
  type: 'booking' | 'payment' | 'withdrawal' | 'cancellation' | 'approval' | 'general';
  rawType: string;
  title: string;
  message: string;
  read: boolean;
  bookingId?: string;
  createdAt: Date;
}

const notificationKind = (t: string | null): AppNotification['type'] => {
  const v = (t ?? '').toLowerCase();
  if (v.includes('withdrawal')) return 'withdrawal';
  if (v.includes('cancel') || v.includes('refund')) return 'cancellation';
  if (v.includes('approval') || v.includes('vendor_status')) return 'approval';
  if (v.includes('wallet') || v.includes('earning') || v.includes('payment')) return 'payment';
  if (v.includes('booking') || v.includes('trip') || v.includes('dispute')) return 'booking';
  return 'general';
};

export const getMyNotifications = async (limitCount = 50): Promise<AppNotification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limitCount);
  if (error) return [];
  return (data ?? []).map((n) => ({
    id: n.id,
    type: notificationKind(n.type),
    rawType: n.type ?? '',
    title: n.title,
    message: n.body ?? '',
    read: n.read,
    bookingId: n.data?.bookingId,
    createdAt: new Date(n.created_at),
  }));
};

export const markNotificationRead = async (id: string) => {
  await supabase.from('notifications').update({ read: true }).eq('id', id);
};

export const markAllNotificationsRead = async () => {
  await supabase.from('notifications').update({ read: true }).eq('read', false);
};

export const getUnreadNotificationCount = async (): Promise<number> => {
  const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('read', false);
  return count ?? 0;
};

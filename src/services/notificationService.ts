import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { db, auth } from '../config/firebase';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

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

    // Save to pushTokens collection
    await setDoc(doc(db, 'pushTokens', userId), {
      token: pushToken,
      userType,
      userId,
      platform: Platform.OS,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true });

    // Also save token in user/vendor document for easy access
    const collectionName = userType === 'vendor' ? 'vendors' : 'users';
    await updateDoc(doc(db, collectionName, userId), {
      pushToken,
      pushTokenUpdatedAt: serverTimestamp(),
    });

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
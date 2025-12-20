import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { savePushToken } from '../services/notificationService';
import { auth } from '../config/firebase';

export const useNotifications = (userType: 'user' | 'vendor' | 'admin') => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Register for push notifications
    const setupNotifications = async () => {
      const user = auth.currentUser;
      if (user) {
        const success = await savePushToken(user.uid, userType);
        if (success) {
          console.log('✅ Push notifications set up');
          // Get and set the push token
          const token = await Notifications.getExpoPushTokenAsync();
          setExpoPushToken(token.data);
        }
      }
    };

    setupNotifications();

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
        console.log('📬 Notification received:', notification);
      }
    );

    // Listen for notification taps
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('👆 Notification tapped:', response);
        // Handle navigation based on notification data
        const data = response.notification.request.content.data;
        // You can navigate to specific screens based on data
      }
    );

    // Cleanup listeners on unmount
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [userType]);

  return {
    expoPushToken,
    notification,
  };
};
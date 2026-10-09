import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../constants';

interface VendorNotificationPreferencesScreenProps {
  onNavigateBack: () => void;
}

export const VendorNotificationPreferencesScreen: React.FC<VendorNotificationPreferencesScreenProps> = ({
  onNavigateBack,
}) => {
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    
    newBookings: true,
    bookingUpdates: true,
    cancellations: true,
    
    payments: true,
    withdrawals: true,
    
    promotions: false,
    tips: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      // Preferences are saved on this phone.
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const saved = await AsyncStorage.getItem('escardia.vendorNotificationPreferences');
      if (saved) setPreferences(JSON.parse(saved));
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('escardia.vendorNotificationPreferences', JSON.stringify(preferences));

      Alert.alert('Success', 'Preferences saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences');
    }
  };

  const togglePreference = (key: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const PreferenceRow = ({ 
    title, 
    subtitle, 
    value, 
    onToggle 
  }: { 
    title: string; 
    subtitle: string; 
    value: boolean; 
    onToggle: () => void;
  }) => (
    <View style={styles.preferenceRow}>
      <View style={styles.preferenceLeft}>
        <Text style={styles.preferenceTitle}>{title}</Text>
        <Text style={styles.preferenceSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary }}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* General */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 General</Text>
          
          <PreferenceRow
            title="Email Notifications"
            subtitle="Receive updates via email"
            value={preferences.emailNotifications}
            onToggle={() => togglePreference('emailNotifications')}
          />

          <PreferenceRow
            title="Push Notifications"
            subtitle="Receive push notifications on your device"
            value={preferences.pushNotifications}
            onToggle={() => togglePreference('pushNotifications')}
          />

          <PreferenceRow
            title="SMS Notifications"
            subtitle="Receive text messages for important updates"
            value={preferences.smsNotifications}
            onToggle={() => togglePreference('smsNotifications')}
          />
        </View>

        {/* Bookings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Bookings</Text>
          
          <PreferenceRow
            title="New Bookings"
            subtitle="Get notified when you receive a new booking"
            value={preferences.newBookings}
            onToggle={() => togglePreference('newBookings')}
          />

          <PreferenceRow
            title="Booking Updates"
            subtitle="Updates on ongoing bookings"
            value={preferences.bookingUpdates}
            onToggle={() => togglePreference('bookingUpdates')}
          />

          <PreferenceRow
            title="Cancellations"
            subtitle="Notify when customers cancel bookings"
            value={preferences.cancellations}
            onToggle={() => togglePreference('cancellations')}
          />
        </View>

        {/* Financial */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Financial</Text>
          
          <PreferenceRow
            title="Payment Alerts"
            subtitle="Get notified of successful payments"
            value={preferences.payments}
            onToggle={() => togglePreference('payments')}
          />

          <PreferenceRow
            title="Withdrawal Confirmations"
            subtitle="Confirm when funds are withdrawn"
            value={preferences.withdrawals}
            onToggle={() => togglePreference('withdrawals')}
          />
        </View>

        {/* Marketing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📢 Marketing</Text>
          
          <PreferenceRow
            title="Promotions & Offers"
            subtitle="Receive promotional content and special offers"
            value={preferences.promotions}
            onToggle={() => togglePreference('promotions')}
          />

          <PreferenceRow
            title="Tips & Tricks"
            subtitle="Get helpful tips to grow your business"
            value={preferences.tips}
            onToggle={() => togglePreference('tips')}
          />
        </View>

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
  saveText: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: typography.fontWeight.semiBold,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  preferenceLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  preferenceTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: 4,
  },
  preferenceSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  bottomSpacing: {
    height: 40,
  },
});
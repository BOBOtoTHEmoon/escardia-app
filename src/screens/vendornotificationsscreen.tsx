// src/screens/vendornotificationsscreen.tsx
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
import {
  saveNotificationPreferences,
  getNotificationPreferences,
  NotificationPreferences,
} from '../services/notificationservice';

interface VendorNotificationPreferencesScreenProps {
  onNavigateBack: () => void;
}

export const VendorNotificationPreferencesScreen: React.FC<VendorNotificationPreferencesScreenProps> = ({
  onNavigateBack,
}) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
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
      const saved = await getNotificationPreferences();
      if (saved) setPreferences(saved);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await saveNotificationPreferences(preferences);
      Alert.alert('Success', 'Preferences saved!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save');
    }
  };

  const toggle = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const Row = ({ title, subtitle, value, onToggle }: any) => (
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
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backIcon}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <Row title="Email" subtitle="Via email" value={preferences.emailNotifications} onToggle={() => toggle('emailNotifications')} />
          <Row title="Push" subtitle="On your device" value={preferences.pushNotifications} onToggle={() => toggle('pushNotifications')} />
          <Row title="SMS" subtitle="Text messages" value={preferences.smsNotifications} onToggle={() => toggle('smsNotifications')} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bookings</Text>
          <Row title="New Bookings" subtitle="New request" value={preferences.newBookings} onToggle={() => toggle('newBookings')} />
          <Row title="Updates" subtitle="Status changes" value={preferences.bookingUpdates} onToggle={() => toggle('bookingUpdates')} />
          <Row title="Cancellations" subtitle="Customer cancel" value={preferences.cancellations} onToggle={() => toggle('cancellations')} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial</Text>
          <Row title="Payments" subtitle="Payment received" value={preferences.payments} onToggle={() => toggle('payments')} />
          <Row title="Withdrawals" subtitle="Payout sent" value={preferences.withdrawals} onToggle={() => toggle('withdrawals')} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Marketing</Text>
          <Row title="Promotions" subtitle="Offers & deals" value={preferences.promotions} onToggle={() => toggle('promotions')} />
          <Row title="Tips" subtitle="Grow your business" value={preferences.tips} onToggle={() => toggle('tips')} />
        </View>

        <View style={styles.bottomSpacing} />
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
  saveText: { fontSize: typography.fontSize.base, color: colors.primary, fontWeight: '600' },
  scrollView: { flex: 1 },
  section: { padding: spacing.lg },
  sectionTitle: { fontSize: typography.fontSize.lg, fontWeight: 'bold', color: colors.text, marginBottom: spacing.md },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  preferenceLeft: { flex: 1, marginRight: spacing.md },
  preferenceTitle: { fontSize: typography.fontSize.base, fontWeight: '600', color: colors.text, marginBottom: 4 },
  preferenceSubtitle: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  bottomSpacing: { height: 40 },
});
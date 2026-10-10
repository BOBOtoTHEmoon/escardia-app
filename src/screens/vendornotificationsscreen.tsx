// Push notifications for vendors: whether they are on for this phone, and what Escardia sends.
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { auth } from '../config/supabase';
import { getNotificationPermissionStatus, savePushToken } from '../services/notificationService';
import { AppText, Button, IconName, Screen, ScreenHeader } from '../ui';
import { color, gutter, radius, themed, statusBarStyle } from '../theme';

interface VendorNotificationPreferencesScreenProps {
  onNavigateBack: () => void;
}

const WHAT: { icon: IconName; title: string; body: string }[] = [
  { icon: 'calendar', title: 'New bookings', body: 'As soon as a customer pays for one of your cars.' },
  { icon: 'x-circle', title: 'Cancellations', body: 'When a customer cancels a booking.' },
  { icon: 'alert-triangle', title: 'Problems on a trip', body: 'If a customer reports a problem.' },
  { icon: 'credit-card', title: 'Money', body: 'When earnings are released and when withdrawals are paid or fail.' },
  { icon: 'check-circle', title: 'Approvals', body: 'When your account or a car is approved or needs changes.' },
];

export const VendorNotificationPreferencesScreen: React.FC<VendorNotificationPreferencesScreenProps> = ({ onNavigateBack }) => {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const check = useCallback(() => {
    getNotificationPermissionStatus()
      .then(setStatus)
      .catch(() => setStatus('undetermined'));
  }, []);

  useEffect(() => {
    check();
    // Re-check when they come back from the phone's settings.
    const sub = AppState.addEventListener('change', (s) => s === 'active' && check());
    return () => sub.remove();
  }, [check]);

  const turnOn = async () => {
    if (status === 'denied') return Linking.openSettings();
    setBusy(true);
    const uid = auth.currentUser?.uid;
    if (uid) await savePushToken(uid, 'vendor');
    setBusy(false);
    check();
  };

  const on = status === 'granted';

  return (
    <Screen>
      <StatusBar style={statusBarStyle()} />
      <ScreenHeader title="Push notifications" onBack={onNavigateBack} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 40 }}>
        <View style={[styles.status, { backgroundColor: on ? color.successSoft : color.warningSoft }]}>
          {status === null ? (
            <ActivityIndicator color={color.primary} />
          ) : (
            <>
              <View style={[styles.statusIcon, { backgroundColor: on ? color.success : color.warning }]}>
                <Feather name={on ? 'bell' : 'bell-off'} size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="subheading">{on ? 'On for this phone' : 'Off for this phone'}</AppText>
                <AppText variant="small" color={color.text} style={{ marginTop: 2 }}>
                  {on
                    ? 'You will get an alert the moment something needs you.'
                    : 'Turn them on so you never miss a booking. Everything still shows in your notifications inbox.'}
                </AppText>
              </View>
            </>
          )}
        </View>
        {status !== null && !on && (
          <Button title={status === 'denied' ? 'Open phone settings' : 'Turn on notifications'} icon="bell" onPress={turnOn} loading={busy} style={{ marginTop: 14 }} />
        )}

        <AppText variant="heading" style={{ marginTop: 26, marginBottom: 12 }}>
          What we notify you about
        </AppText>
        <View style={styles.list}>
          {WHAT.map((w, i) => (
            <View key={w.title} style={[styles.row, i < WHAT.length - 1 && styles.border]}>
              <View style={styles.icon}>
                <Feather name={w.icon} size={16} color={color.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyMedium">{w.title}</AppText>
                <AppText variant="small" color={color.muted}>
                  {w.body}
                </AppText>
              </View>
            </View>
          ))}
        </View>
        <AppText variant="small" color={color.muted} style={{ marginTop: 12 }}>
          These are about your bookings and money, so they cannot be switched off one by one. To stop all alerts, turn notifications off in your phone settings.
        </AppText>
      </ScrollView>
    </Screen>
  );
};

const styles = themed(() => StyleSheet.create({
  status: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: radius.xl, minHeight: 80 },
  statusIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  list: { backgroundColor: color.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: color.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  border: { borderBottomWidth: 1, borderBottomColor: color.border },
  icon: { width: 36, height: 36, borderRadius: 11, backgroundColor: color.primarySoft, alignItems: 'center', justifyContent: 'center' },
}));

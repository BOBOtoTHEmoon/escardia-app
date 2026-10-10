import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { AppText, IconName, Screen, ScreenHeader } from '../ui';
import { color, gutter, radius, themed, statusBarStyle } from '../theme';

interface SafetyTipsScreenProps {
  onNavigateBack: () => void;
}

const TIPS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'user-check', title: 'Check before you get in', body: 'Make sure the car and driver match what you see in My Trips. If anything is different, do not get in and call the vendor or Escardia.' },
  { icon: 'lock', title: 'Keep your codes private', body: 'Never share your password or one-time codes. Escardia staff will never ask for them.' },
  { icon: 'credit-card', title: 'Pay only in the app', body: 'Every trip is paid through Escardia. Do not pay drivers or vendors directly for a booked trip.' },
  { icon: 'share-2', title: 'Tell someone your plans', body: 'Share your trip ID and times with a friend or family member, especially for late-night trips.' },
  { icon: 'alert-triangle', title: 'Report problems quickly', body: 'Use Report a problem on the trip screen during the trip or within 24 hours after. In an emergency, call 112 first.' },
  { icon: 'download', title: 'Keep the app updated', body: 'Updates include the latest security fixes.' },
];

export const SafetyTipsScreen: React.FC<SafetyTipsScreenProps> = ({ onNavigateBack }) => (
  <Screen>
    <StatusBar style={statusBarStyle()} />
    <ScreenHeader title="Safety tips" onBack={onNavigateBack} />
    <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 40 }}>
      {TIPS.map((t) => (
        <View key={t.title} style={styles.tip}>
          <View style={styles.icon}>
            <Feather name={t.icon} size={18} color={color.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="subheading">{t.title}</AppText>
            <AppText variant="body" color={color.text} style={{ marginTop: 2 }}>
              {t.body}
            </AppText>
          </View>
        </View>
      ))}
    </ScrollView>
  </Screen>
);

const styles = themed(() => StyleSheet.create({
  tip: { flexDirection: 'row', gap: 14, padding: 16, marginTop: 10, borderRadius: radius.lg, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border },
  icon: { width: 40, height: 40, borderRadius: 12, backgroundColor: color.primarySoft, alignItems: 'center', justifyContent: 'center' },
}));

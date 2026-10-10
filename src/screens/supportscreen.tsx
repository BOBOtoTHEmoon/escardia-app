import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { AppText, IconName, Screen, ScreenHeader } from '../ui';
import { MenuGroup, MenuRow } from '../ui/Menu';
import { CONTACT } from './contactusscreen';
import { brand, color, gutter, radius, themed, statusBarStyle } from '../theme';

interface SupportScreenProps {
  onNavigateBack: () => void;
  onNavigateToFAQ: () => void;
  onNavigateToPolicies: () => void;
  onNavigateToContactUs: () => void;
}

export const SupportScreen: React.FC<SupportScreenProps> = ({ onNavigateBack, onNavigateToFAQ, onNavigateToPolicies, onNavigateToContactUs }) => {
  const quick: { icon: IconName; label: string; onPress: () => void }[] = [
    { icon: 'phone', label: 'Call', onPress: () => Linking.openURL(`tel:${CONTACT.phone}`) },
    { icon: 'message-circle', label: 'WhatsApp', onPress: () => Linking.openURL(CONTACT.whatsapp).catch(() => {}) },
    { icon: 'mail', label: 'Email', onPress: () => Linking.openURL(`mailto:${CONTACT.email}`) },
  ];
  return (
    <Screen>
      <StatusBar style={statusBarStyle()} />
      <ScreenHeader title="Help and support" onBack={onNavigateBack} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.glow} />
          <AppText variant="heading" color="#FFFFFF">
            How can we help?
          </AppText>
          <AppText variant="small" color={color.onDarkMuted} style={{ marginTop: 4 }}>
            Our team is here for bookings, payments and anything on the road.
          </AppText>
          <View style={styles.quick}>
            {quick.map((q) => (
              <Pressable key={q.label} onPress={q.onPress} style={({ pressed }) => [styles.quickBtn, pressed && { backgroundColor: 'rgba(255,255,255,0.16)' }]}>
                <Feather name={q.icon} size={18} color="#FFFFFF" />
                <AppText variant="smallMedium" color="#FFFFFF">
                  {q.label}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>

        <MenuGroup title="Answers">
          <MenuRow icon="help-circle" label="Frequently asked questions" hint="Booking, payments, refunds and more" onPress={onNavigateToFAQ} />
          <MenuRow icon="file-text" label="Our policies" hint="Safety, privacy, payments and conduct" onPress={onNavigateToPolicies} last />
        </MenuGroup>

        <MenuGroup title="Talk to us">
          <MenuRow icon="headphones" label="All contact options" hint="Phone, WhatsApp, email and social" onPress={onNavigateToContactUs} last />
        </MenuGroup>

        <View style={styles.tip}>
          <Feather name="alert-triangle" size={16} color={color.warning} style={{ marginTop: 2 }} />
          <AppText variant="small" color={color.text} style={{ flex: 1 }}>
            Problem with a trip? Open it in My Trips and tap Report a problem. That pauses the vendor&apos;s payment until we sort it out.
          </AppText>
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = themed(() => StyleSheet.create({
  hero: { padding: 20, borderRadius: radius.xl, backgroundColor: color.navy, overflow: 'hidden' },
  glow: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: brand[600], opacity: 0.32, right: -90, top: -120 },
  quick: { flexDirection: 'row', gap: 10, marginTop: 18 },
  quickBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  tip: { flexDirection: 'row', gap: 10, marginTop: 22, padding: 14, borderRadius: radius.lg, backgroundColor: color.warningSoft },
}));

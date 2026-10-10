// "Become a vendor" landing: what Escardia does for vendors, how it works, and the way in.
import React from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, IconButton, IconName, LogoTile } from '../ui';
import { useAppSettings } from '../hooks/useAppSettings';
import { brand, color, gutter, radius, themed } from '../theme';

interface VendorOnboardingScreenProps {
  onComplete: () => void;
  onNavigateToVendorSignIn: () => void;
  onNavigateBack: () => void;
}

export const VendorOnboardingScreen: React.FC<VendorOnboardingScreenProps> = ({ onComplete, onNavigateToVendorSignIn, onNavigateBack }) => {
  const insets = useSafeAreaInsets();
  const { settings } = useAppSettings();
  const commission = `${Math.round(settings.commissionRate * 1000) / 10}%`;

  const PERKS: { icon: IconName; title: string; body: string }[] = [
    { icon: 'shield', title: 'Paid upfront, every time', body: 'Customers pay in full when they book. No chasing payments.' },
    { icon: 'calendar', title: 'Bookings straight to your phone', body: 'See every booking, assign your driver and track trips in one place.' },
    { icon: 'trending-up', title: 'Your prices, your fleet', body: 'Set daily and hourly rates and take cars offline whenever you need.' },
  ];

  const STEPS: { title: string; body: string }[] = [
    { title: 'Create your vendor account', body: 'Your details, your business name and a photo of your ID. About five minutes.' },
    { title: 'List your cars', body: 'Add photos and prices. Escardia checks your details and each car before it goes live.' },
    {
      title: 'Take bookings and get paid',
      body: `Escardia keeps a ${commission} commission. Your share is released ${settings.payoutHoldHours} hours after each trip, then you withdraw to your bank.`,
    },
  ];

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
          <View style={styles.glowA} />
          <View style={styles.glowB} />
          <View style={styles.top}>
            <IconButton icon="chevron-left" dark onPress={onNavigateBack} accessibilityLabel="Go back" />
            <View style={styles.chip}>
              <Feather name="briefcase" size={13} color={brand[200]} />
              <AppText variant="smallMedium" color={color.primaryBorder}>
                Escardia for vendors
              </AppText>
            </View>
            <LogoTile size={40} />
          </View>

          <AppText variant="display" color={color.onDark} style={{ marginTop: 28 }}>
            Earn with your{'\n'}luxury cars
          </AppText>
          <AppText variant="body" color={color.onDarkMuted} style={{ marginTop: 10, maxWidth: 330 }}>
            List your fleet on Escardia and get bookings from customers across Lagos who want premium cars and professional drivers.
          </AppText>

          <Image source={require('../../assets/images/promocar.png')} style={styles.car} resizeMode="contain" />
        </View>

        {/* The light panel runs to the bottom of the screen; its own padding clears the home bar. */}
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
          {PERKS.map((p) => (
            <View key={p.title} style={styles.perk}>
              <View style={styles.perkIcon}>
                <Feather name={p.icon} size={18} color={color.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="subheading">{p.title}</AppText>
                <AppText variant="small" color={color.muted} style={{ marginTop: 2 }}>
                  {p.body}
                </AppText>
              </View>
            </View>
          ))}

          <AppText variant="caption" color={color.muted} style={{ marginTop: 24, marginBottom: 12 }}>
            How it works
          </AppText>
          <View style={styles.steps}>
            {STEPS.map((s, i) => (
              <View key={s.title} style={styles.stepRow}>
                <View style={{ alignItems: 'center' }}>
                  <View style={styles.stepNum}>
                    <AppText variant="smallMedium" color="#FFFFFF">
                      {i + 1}
                    </AppText>
                  </View>
                  {i < STEPS.length - 1 && <View style={styles.stepLine} />}
                </View>
                <View style={{ flex: 1, paddingBottom: i < STEPS.length - 1 ? 18 : 0 }}>
                  <AppText variant="bodyMedium">{s.title}</AppText>
                  <AppText variant="small" color={color.muted} style={{ marginTop: 2 }}>
                    {s.body}
                  </AppText>
                </View>
              </View>
            ))}
          </View>

          <Button title="Become a vendor" iconRight="arrow-right" onPress={onComplete} style={{ marginTop: 28 }} />
          <Button title="I already have a vendor account" variant="secondary" onPress={onNavigateToVendorSignIn} style={{ marginTop: 12 }} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: color.navy },
  hero: { paddingHorizontal: gutter, paddingBottom: 40, overflow: 'hidden' },
  glowA: { position: 'absolute', width: 340, height: 340, borderRadius: 170, backgroundColor: brand[600], opacity: 0.35, top: -160, right: -130 },
  glowB: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: brand[500], opacity: 0.16, bottom: -80, left: -90 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  car: { width: '100%', height: 200, marginTop: 12, marginBottom: -12 },
  sheet: {
    flex: 1,
    backgroundColor: color.bg,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    marginTop: -24,
    paddingHorizontal: gutter,
    paddingTop: 24,
  },
  perk: {
    flexDirection: 'row',
    gap: 14,
    padding: 14,
    marginBottom: 10,
    borderRadius: radius.xl,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  perkIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: color.primarySoft, alignItems: 'center', justifyContent: 'center' },
  steps: { padding: 16, borderRadius: radius.xl, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border },
  stepRow: { flexDirection: 'row', gap: 14 },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center' },
  stepLine: { flex: 1, width: 2, backgroundColor: color.primaryBorder, marginVertical: 4 },
}));

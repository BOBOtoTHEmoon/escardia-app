import React from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, IconName, LogoTile } from '../ui';
import { brand, color, gutter, themed } from '../theme';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

const { width, height } = Dimensions.get('window');
// The photo is cropped at the car's rear, so it sits flush against the right edge.
const CAR_RATIO = 674 / 553;
// Pills stay on one line: slightly smaller text on narrow phones.
const PILL_FONT = width >= 385 ? 11 : width >= 370 ? 10.5 : 10;
const PILL_PAD = width >= 385 ? 10 : width >= 370 ? 8 : 7;
const CAR_WIDTH = Math.min(width * 0.8, height * (height < 760 ? 0.24 : 0.3) * CAR_RATIO);

const PERKS: { icon: IconName; label: string }[] = [
  { icon: 'check-circle', label: 'Vetted vendors' },
  { icon: 'shield', label: 'Security' },
  { icon: 'lock', label: 'Safe payments' },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted }) => {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient colors={[brand[950], '#0A1128', '#070C1C']} locations={[0, 0.6, 1]} style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.glow} />

      <View style={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.brandRow}>
          <LogoTile size={36} />
          <AppText variant="subheading" color={color.onDark}>
            Escardia
          </AppText>
        </View>

        <AppText variant="display" color={color.onDark} style={styles.headline}>
          Premium cars,{'\n'}whenever you{'\n'}need them.
        </AppText>
        <AppText variant="body" color={color.onDarkMuted} style={{ marginTop: 12, maxWidth: 300 }}>
          Luxury rides, professional drivers and security escorts across Lagos, booked in a few taps.
        </AppText>

        <View style={styles.carWrap}>
          <Image source={require('../../assets/images/welcomecar-hero.png')} style={styles.car} resizeMode="contain" />
        </View>

        <View style={styles.perks}>
          {PERKS.map((p) => (
            <View key={p.label} style={styles.perk}>
              <Feather name={p.icon} size={PILL_FONT} color={brand[300]} />
              <AppText variant="smallMedium" color={color.onDark} numberOfLines={1} style={{ fontSize: PILL_FONT, lineHeight: 14 }}>
                {p.label}
              </AppText>
            </View>
          ))}
        </View>

        <Button title="Get started" variant="white" iconRight="arrow-right" onPress={onGetStarted} />
      </View>
    </LinearGradient>
  );
};

const styles = themed(() => StyleSheet.create({
  root: { flex: 1 },
  glow: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: brand[600],
    opacity: 0.18,
    top: '38%',
    left: -width * 0.1,
  },
  content: { flex: 1, paddingHorizontal: gutter },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headline: { marginTop: height < 760 ? 24 : 36, fontSize: 38, lineHeight: 44 },
  carWrap: { flex: 1, justifyContent: 'center', alignItems: 'flex-end', marginRight: -gutter, marginVertical: 12 },
  car: { width: CAR_WIDTH, height: CAR_WIDTH / CAR_RATIO },
  perks: { flexDirection: 'row', justifyContent: 'center', gap: width >= 370 ? 6 : 5, marginBottom: 20 },
  perk: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: PILL_PAD,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
}));

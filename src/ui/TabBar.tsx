// Floating pill navigation for the customer and vendor tabs.
// The active tab grows into a blue pill with its label.
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, IconName } from './index';
import { color, shadow, themed } from '../theme';

export type CustomerTab = 'home' | 'cars' | 'trips' | 'profile';

const TABS: { key: CustomerTab; label: string; icon: IconName }[] = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'cars', label: 'Cars', icon: 'search' },
  { key: 'trips', label: 'Trips', icon: 'calendar' },
  { key: 'profile', label: 'Profile', icon: 'user' },
];

/** Height to leave at the bottom of scroll content so the bar never covers it. */
export const TAB_BAR_SPACE = 110;

type TabDef<K extends string> = { key: K; label: string; icon: IconName };

const PillBar = <K extends string>({ tabs, active, onNavigate }: { tabs: TabDef<K>[]; active: K; onNavigate: (tab: K) => void }) => {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
      <View style={[styles.bar, shadow.lg]}>
        {tabs.map((t) => (
          <Tab key={t.key} tab={t} active={t.key === active} onPress={() => t.key !== active && onNavigate(t.key)} />
        ))}
      </View>
    </View>
  );
};

export const TabBar = ({ active, onNavigate }: { active: CustomerTab; onNavigate: (tab: CustomerTab) => void }) => (
  <PillBar tabs={TABS} active={active} onNavigate={onNavigate} />
);

export type VendorTab = 'dashboard' | 'fleet' | 'bookings' | 'earnings' | 'profile';

const VENDOR_TABS: TabDef<VendorTab>[] = [
  { key: 'dashboard', label: 'Home', icon: 'grid' },
  { key: 'fleet', label: 'Fleet', icon: 'truck' },
  { key: 'bookings', label: 'Bookings', icon: 'calendar' },
  { key: 'earnings', label: 'Earnings', icon: 'credit-card' },
  { key: 'profile', label: 'Account', icon: 'user' },
];

/** Vendor tabs: same pill bar, five tabs. */
export const VendorTabBar = ({ active, onNavigate }: { active: VendorTab; onNavigate: (tab: VendorTab) => void }) => (
  <PillBar tabs={VENDOR_TABS} active={active} onNavigate={onNavigate} />
);

const Tab = ({ tab, active, onPress }: { tab: TabDef<string>; active: boolean; onPress: () => void }) => {
  const anim = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: active ? 1 : 0, useNativeDriver: false, friction: 9, tension: 80 }).start();
  }, [active, anim]);

  return (
    <Pressable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: active }} accessibilityLabel={tab.label}>
      <Animated.View
        style={[
          styles.tab,
          {
            backgroundColor: anim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(47,95,237,0)', color.primary] }),
            paddingHorizontal: anim.interpolate({ inputRange: [0, 1], outputRange: [13, 16] }),
          },
        ]}
      >
        <Feather name={tab.icon} size={20} color={active ? '#FFFFFF' : color.muted} />
        {active && (
          <AppText variant="smallMedium" color="#FFFFFF" style={{ marginLeft: 8, fontSize: 14 }}>
            {tab.label}
          </AppText>
        )}
      </Animated.View>
    </Pressable>
  );
};

const styles = themed(() => StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
    borderRadius: 999,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  tab: { height: 48, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
}));

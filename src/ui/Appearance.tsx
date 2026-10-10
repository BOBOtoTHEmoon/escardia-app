// Light / dark mode setting: follow the phone (default), or always light, or always dark.
import React, { createContext, useContext, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppText, Button, IconName } from './index';
import { BottomSheet } from './Kit';
import { MenuRow } from './Menu';
import { color, radius, themed } from '../theme';

export type ThemeMode = 'system' | 'light' | 'dark';
export const THEME_MODE_KEY = 'escardia.themeMode';

export const ThemeModeContext = createContext<{ mode: ThemeMode; setMode: (m: ThemeMode) => void }>({
  mode: 'system',
  setMode: () => {},
});
export const useThemeMode = () => useContext(ThemeModeContext);

const OPTIONS: { key: ThemeMode; label: string; hint: string; icon: IconName }[] = [
  { key: 'system', label: 'Match my phone', hint: 'Switches with your phone’s light or dark setting', icon: 'smartphone' },
  { key: 'light', label: 'Light', hint: 'Always light', icon: 'sun' },
  { key: 'dark', label: 'Dark', hint: 'Always dark', icon: 'moon' },
];

const LABEL: Record<ThemeMode, string> = { system: 'Match phone', light: 'Light', dark: 'Dark' };

/** Menu row that opens the Appearance sheet. Drop it into any MenuGroup. */
export const AppearanceRow = ({ last }: { last?: boolean }) => {
  const { mode, setMode } = useThemeMode();
  const [open, setOpen] = useState(false);
  return (
    <>
      <MenuRow
        icon={mode === 'dark' ? 'moon' : mode === 'light' ? 'sun' : 'smartphone'}
        label="Appearance"
        onPress={() => setOpen(true)}
        last={last}
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <AppText variant="small" color={color.muted}>
              {LABEL[mode]}
            </AppText>
            <Feather name="chevron-right" size={18} color={color.subtle} />
          </View>
        }
      />
      <BottomSheet visible={open} onClose={() => setOpen(false)} title="Appearance" subtitle="Choose how Escardia looks on this phone.">
        {OPTIONS.map((o) => {
          const on = o.key === mode;
          return (
            <Pressable
              key={o.key}
              onPress={() => {
                setOpen(false);
                // Let the sheet close before the colours change.
                setTimeout(() => setMode(o.key), 250);
              }}
              style={[styles.option, on && styles.optionOn]}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
            >
              <View style={[styles.icon, on && { backgroundColor: color.primary }]}>
                <Feather name={o.icon} size={17} color={on ? '#FFFFFF' : color.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyMedium">{o.label}</AppText>
                <AppText variant="small" color={color.muted}>
                  {o.hint}
                </AppText>
              </View>
              {on ? <Feather name="check-circle" size={20} color={color.primary} /> : <View style={styles.radio} />}
            </Pressable>
          );
        })}
        <Button title="Done" variant="secondary" onPress={() => setOpen(false)} style={{ marginTop: 6 }} />
      </BottomSheet>
    </>
  );
};

const styles = themed(() =>
  StyleSheet.create({
    option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 10, borderRadius: radius.lg, borderWidth: 1, borderColor: color.border, backgroundColor: color.surface },
    optionOn: { borderColor: color.primary, backgroundColor: color.highlight },
    icon: { width: 38, height: 38, borderRadius: 12, backgroundColor: color.primarySoft, alignItems: 'center', justifyContent: 'center' },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: color.borderStrong },
  })
);

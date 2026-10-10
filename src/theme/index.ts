// ============================================
// ESCARDIA - Design system
// Same blue as the admin dashboard (#2F5FED), Poppins font, navy for premium moments.
//
// Light and dark mode:
// - `color` always returns the colours of the theme that is showing right now.
// - Styles are written as `themed(() => StyleSheet.create({...}))`. They are built
//   once per theme the first time they are used, so switching is instant.
// - App.tsx decides the theme (phone setting, or the user's choice in Appearance)
//   and calls setActiveScheme() before drawing the screens.
// ============================================
import { Platform, ViewStyle } from 'react-native';

export const brand = {
  50: '#EEF3FF',
  100: '#DFE8FF',
  200: '#C4D4FE',
  300: '#9DB6FC',
  400: '#6E8FF7',
  500: '#4B72F2',
  600: '#2F5FED',
  700: '#2349C9',
  800: '#1E3A8A',
  900: '#172C66',
  950: '#0D1A3F',
};

export const slate = {
  50: '#F8FAFC',
  100: '#F1F5F9',
  200: '#E2E8F0',
  300: '#CBD5E1',
  400: '#94A3B8',
  500: '#64748B',
  600: '#475569',
  700: '#334155',
  800: '#1E293B',
  900: '#0F172A',
};

const lightColors = {
  // Surfaces
  bg: '#F5F7FB',
  surface: '#FFFFFF',
  sunken: slate[100],
  navy: '#0B1530',
  navySoft: '#14214A',
  overlay: 'rgba(15,23,42,0.45)',

  // Text
  ink: slate[900],
  text: slate[700],
  muted: slate[500],
  subtle: slate[400],
  onDark: '#FFFFFF',
  onDarkMuted: '#A9B8E8',

  // Lines
  border: slate[200],
  borderStrong: slate[300],

  // Brand
  primary: brand[600],
  primaryPressed: brand[700],
  primarySoft: brand[50],
  primaryBorder: brand[100],
  primaryLine: brand[200],
  highlight: '#FAFBFF',

  // Status (always shown with a label or icon, never colour alone)
  success: '#059669',
  successSoft: '#ECFDF5',
  warning: '#D97706',
  warningSoft: '#FFFBEB',
  warningBorder: '#FDE68A',
  danger: '#DC2626',
  dangerSoft: '#FEF2F2',
  dangerBorder: '#FECACA',
  violet: '#7C3AED',
  violetSoft: '#F5F3FF',
};

export type Palette = typeof lightColors;

const darkColors: Palette = {
  bg: '#090D18',
  surface: '#121828',
  sunken: '#1A2236',
  navy: '#0E1936',
  navySoft: '#17244F',
  overlay: 'rgba(0,0,0,0.6)',

  ink: '#F1F5F9',
  text: '#CBD5E1',
  muted: '#94A3B8',
  subtle: '#64748B',
  onDark: '#FFFFFF',
  onDarkMuted: '#A9B8E8',

  border: '#242D42',
  borderStrong: '#334155',

  primary: '#4B72F2',
  primaryPressed: '#2F5FED',
  primarySoft: 'rgba(75,114,242,0.16)',
  primaryBorder: 'rgba(75,114,242,0.28)',
  primaryLine: 'rgba(110,143,247,0.45)',
  highlight: 'rgba(75,114,242,0.10)',

  success: '#34D399',
  successSoft: 'rgba(16,185,129,0.15)',
  warning: '#FBBF24',
  warningSoft: 'rgba(245,158,11,0.15)',
  warningBorder: 'rgba(245,158,11,0.35)',
  danger: '#F87171',
  dangerSoft: 'rgba(239,68,68,0.15)',
  dangerBorder: 'rgba(239,68,68,0.35)',
  violet: '#A78BFA',
  violetSoft: 'rgba(139,92,246,0.16)',
};

export type Scheme = 'light' | 'dark';
let activeScheme: Scheme = 'light';
let active: Palette = lightColors;

/** Called by App.tsx before it draws the screens. */
export const setActiveScheme = (s: Scheme) => {
  activeScheme = s;
  active = s === 'dark' ? darkColors : lightColors;
};
export const isDark = () => activeScheme === 'dark';
export const currentScheme = () => activeScheme;

/** Colours of the theme showing right now. */
export const color: Palette = new Proxy({} as Palette, {
  get: (_, key: string) => active[key as keyof Palette],
});

/** Status bar text colour for screens with a light (or dark) background. */
export const statusBarStyle = (): 'light' | 'dark' => (activeScheme === 'dark' ? 'light' : 'dark');

/**
 * Styles that follow the theme. Write `const styles = themed(() => StyleSheet.create({...}))`
 * and use `styles.x` as usual. Built once per theme, the first time they are read.
 */
export const themed = <T extends object>(build: () => T): T => {
  const cache: Partial<Record<Scheme, T>> = {};
  return new Proxy({} as T, {
    get: (_, key) => {
      const s = activeScheme;
      if (!cache[s]) cache[s] = build();
      return (cache[s] as any)[key];
    },
  });
};

export const font = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
};

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

/** Screen side padding everywhere. */
export const gutter = 20;

const makeShadow = (y: number, blur: number, opacity: number, elevation: number): ViewStyle =>
  Platform.select({
    ios: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: y }, shadowOpacity: opacity, shadowRadius: blur },
    default: { elevation },
  }) as ViewStyle;

export const shadow = {
  sm: makeShadow(1, 3, 0.06, 1),
  md: makeShadow(4, 12, 0.08, 3),
  lg: makeShadow(10, 30, 0.12, 8),
};

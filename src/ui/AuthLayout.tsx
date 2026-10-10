// Navy hero on top, white sheet with the form underneath.
// Used by sign in, sign up and forgot password.
import React, { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, IconButton, LogoTile } from './index';
import { brand, color, gutter, radius, themed } from '../theme';

export const AuthLayout = ({
  title,
  subtitle,
  onBack,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" bounces={false} showsVerticalScrollIndicator={false}>
          <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
            <View style={styles.glowA} />
            <View style={styles.glowB} />
            <View style={styles.heroTop}>
              {onBack ? <IconButton icon="chevron-left" dark onPress={onBack} accessibilityLabel="Go back" /> : <View style={{ height: 44 }} />}
              <LogoTile size={40} />
            </View>
            <AppText variant="title" color={color.onDark} style={{ marginTop: 28 }}>
              {title}
            </AppText>
            {subtitle && (
              <AppText variant="body" color={color.onDarkMuted} style={{ marginTop: 6, maxWidth: 320 }}>
                {subtitle}
              </AppText>
            )}
          </View>

          <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
            {children}
            {footer && <View style={styles.footer}>{footer}</View>}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: color.navy },
  hero: {
    paddingHorizontal: gutter,
    paddingBottom: 48,
    overflow: 'hidden',
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  glowA: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: brand[600],
    opacity: 0.35,
    top: -150,
    right: -120,
  },
  glowB: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: brand[500],
    opacity: 0.15,
    bottom: -90,
    left: -60,
  },
  sheet: {
    flex: 1,
    backgroundColor: color.bg,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    marginTop: -24,
    paddingHorizontal: gutter,
    paddingTop: 28,
  },
  footer: { marginTop: 'auto', paddingTop: 28, alignItems: 'center' },
}));

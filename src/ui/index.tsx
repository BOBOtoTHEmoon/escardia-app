// ============================================
// ESCARDIA - Shared UI pieces for the redesign
// ============================================
import React, { ReactNode, forwardRef, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand, color, font, radius, shadow, space, themed, isDark } from '../theme';

export type IconName = React.ComponentProps<typeof Feather>['name'];

/* ------------------------------------------------------------------ */
/* Text                                                                */
/* ------------------------------------------------------------------ */

const VARIANTS = {
  display: { fontFamily: font.semibold, fontSize: 32, lineHeight: 40, letterSpacing: -0.8 },
  title: { fontFamily: font.semibold, fontSize: 24, lineHeight: 32, letterSpacing: -0.5 },
  heading: { fontFamily: font.semibold, fontSize: 18, lineHeight: 25, letterSpacing: -0.2 },
  subheading: { fontFamily: font.semibold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: font.regular, fontSize: 14.5, lineHeight: 22 },
  bodyMedium: { fontFamily: font.medium, fontSize: 14.5, lineHeight: 22 },
  small: { fontFamily: font.regular, fontSize: 13, lineHeight: 18 },
  smallMedium: { fontFamily: font.medium, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: font.medium, fontSize: 11, lineHeight: 14, letterSpacing: 0.6, textTransform: 'uppercase' as const },
} satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof VARIANTS;

export const AppText = ({
  variant = 'body',
  color: c = color.ink,
  center,
  style,
  children,
  ...rest
}: TextProps & { variant?: TextVariant; color?: string; center?: boolean }) => (
  <Text {...rest} style={[VARIANTS[variant], { color: c }, center && { textAlign: 'center' }, style]}>
    {children}
  </Text>
);

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'white' | 'danger' | 'darkGhost';

const BUTTON: Record<ButtonVariant, { bg: string; pressed: string; text: string; border?: string }> = themed(() => ({
  primary: { bg: color.primary, pressed: color.primaryPressed, text: '#FFFFFF' },
  secondary: { bg: color.surface, pressed: color.sunken, text: color.ink, border: color.border },
  ghost: { bg: 'transparent', pressed: color.sunken, text: color.primary },
  white: { bg: '#FFFFFF', pressed: brand[50], text: brand[950] },
  danger: { bg: color.danger, pressed: '#B91C1C', text: '#FFFFFF' },
  darkGhost: { bg: 'rgba(255,255,255,0.08)', pressed: 'rgba(255,255,255,0.16)', text: '#FFFFFF', border: 'rgba(255,255,255,0.18)' },
}));

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon,
  iconRight,
  loading,
  disabled,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: 'md' | 'lg';
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) => {
  const v = BUTTON[variant];
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        size === 'md' ? styles.buttonMd : styles.buttonLg,
        { backgroundColor: pressed ? v.pressed : v.bg },
        v.border ? { borderWidth: 1, borderColor: v.border } : null,
        pressed && { transform: [{ scale: 0.985 }] },
        off && { opacity: 0.55 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} />
      ) : (
        <>
          {icon && <Feather name={icon} size={18} color={v.text} />}
          <Text style={[styles.buttonText, { color: v.text }]}>{title}</Text>
          {iconRight && <Feather name={iconRight} size={18} color={v.text} />}
        </>
      )}
    </Pressable>
  );
};

/** Round icon button, e.g. back. */
export const IconButton = ({
  icon,
  onPress,
  dark,
  size = 44,
  style,
  accessibilityLabel,
}: {
  icon: IconName;
  onPress?: () => void;
  dark?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) => (
  <Pressable
    onPress={onPress}
    hitSlop={8}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    style={({ pressed }) => [
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: dark ? (pressed ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)') : pressed ? color.sunken : color.surface,
        borderWidth: 1,
        borderColor: dark ? 'rgba(255,255,255,0.14)' : color.border,
      },
      style,
    ]}
  >
    <Feather name={icon} size={20} color={dark ? '#FFFFFF' : color.ink} />
  </Pressable>
);

/** Text-only link. */
export const LinkText = ({ children, onPress, style }: { children: ReactNode; onPress?: () => void; style?: StyleProp<TextStyle> }) => (
  <Text onPress={onPress} style={[{ fontFamily: font.semibold, fontSize: 14, color: color.primary }, style]} suppressHighlighting>
    {children}
  </Text>
);

/* ------------------------------------------------------------------ */
/* Inputs                                                              */
/* ------------------------------------------------------------------ */

export const TextField = forwardRef<
  TextInput,
  TextInputProps & { label?: string; icon?: IconName; error?: string; hint?: string; isPassword?: boolean; containerStyle?: StyleProp<ViewStyle> }
>(({ label, icon, error, hint, isPassword, containerStyle, onFocus, onBlur, ...props }, ref) => {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  return (
    <View style={[{ marginBottom: space.lg }, containerStyle]}>
      {label && (
        <AppText variant="smallMedium" color={color.text} style={{ marginBottom: 6 }}>
          {label}
        </AppText>
      )}
      <View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          !!error && styles.fieldError,
        ]}
      >
        {icon && <Feather name={icon} size={18} color={focused ? color.primary : color.subtle} style={{ marginRight: 10 }} />}
        <TextInput
          ref={ref}
          placeholderTextColor={color.subtle}
          keyboardAppearance={isDark() ? 'dark' : 'light'}
          secureTextEntry={isPassword && !visible}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={styles.fieldInput}
          {...props}
        />
        {isPassword && (
          <Pressable onPress={() => setVisible(!visible)} hitSlop={10} accessibilityLabel={visible ? 'Hide password' : 'Show password'}>
            <Feather name={visible ? 'eye-off' : 'eye'} size={18} color={color.subtle} />
          </Pressable>
        )}
      </View>
      {!!error && (
        <View style={styles.fieldMessage}>
          <Feather name="alert-circle" size={13} color={color.danger} />
          <AppText variant="small" color={color.danger} style={{ flex: 1 }}>
            {error}
          </AppText>
        </View>
      )}
      {!error && !!hint && (
        <AppText variant="small" color={color.muted} style={{ marginTop: 6 }}>
          {hint}
        </AppText>
      )}
    </View>
  );
});
TextField.displayName = 'TextField';

export const Checkbox = ({ checked, onPress, children }: { checked: boolean; onPress: () => void; children: ReactNode }) => (
  <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }} accessibilityRole="checkbox" accessibilityState={{ checked }}>
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: 7,
        borderWidth: 1.5,
        borderColor: checked ? color.primary : color.borderStrong,
        backgroundColor: checked ? color.primary : color.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
      }}
    >
      {checked && <Feather name="check" size={14} color="#FFFFFF" />}
    </View>
    <View style={{ flex: 1 }}>{children}</View>
  </Pressable>
);


/** Six boxes backed by one hidden input, so paste and SMS/email autofill work. */
export const OtpInput = ({
  value,
  onChange,
  length = 6,
  error,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  error?: boolean;
  autoFocus?: boolean;
}) => {
  const ref = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
      {Array.from({ length }).map((_, i) => {
        const ch = value[i];
        const active = focused && (i === value.length || (i === length - 1 && value.length === length));
        return (
          <View
            key={i}
            style={[
              styles.otpBox,
              !!ch && styles.otpBoxFilled,
              active && styles.otpBoxActive,
              error && styles.otpBoxError,
            ]}
          >
            <Text style={styles.otpText}>{ch ?? ''}</Text>
          </View>
        );
      })}
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={length}
        autoFocus={autoFocus}
        caretHidden
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.otpHidden}
        accessibilityLabel="Verification code"
      />
    </View>
  );
};

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

/** Plain screen background with safe-area padding at the top. */
export const Screen = ({ children, style, dark }: { children: ReactNode; style?: StyleProp<ViewStyle>; dark?: boolean }) => {
  const insets = useSafeAreaInsets();
  return <View style={[{ flex: 1, backgroundColor: dark ? color.navy : color.bg, paddingTop: insets.top }, style]}>{children}</View>;
};


/** Back button, title and an optional action on the right. */
export const ScreenHeader = ({ title, onBack, right, subtitle }: { title: string; onBack?: () => void; right?: ReactNode; subtitle?: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
    {onBack && <IconButton icon="chevron-left" onPress={onBack} accessibilityLabel="Go back" />}
    <View style={{ flex: 1 }}>
      <AppText variant="heading" numberOfLines={1}>
        {title}
      </AppText>
      {!!subtitle && (
        <AppText variant="small" color={color.muted} numberOfLines={1}>
          {subtitle}
        </AppText>
      )}
    </View>
    {right}
  </View>
);

export const Card = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => (
  <View style={[{ backgroundColor: color.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: color.border }, shadow.sm, style]}>{children}</View>
);

export const Banner = ({ tone = 'danger', text }: { tone?: 'danger' | 'success' | 'info'; text: string }) => {
  const t = {
    danger: { bg: color.dangerSoft, fg: color.danger, icon: 'alert-circle' as IconName },
    success: { bg: color.successSoft, fg: color.success, icon: 'check-circle' as IconName },
    info: { bg: color.primarySoft, fg: color.primary, icon: 'info' as IconName },
  }[tone];
  return (
    <View style={{ flexDirection: 'row', gap: 10, backgroundColor: t.bg, borderRadius: radius.md, padding: 12, marginBottom: space.lg }}>
      <Feather name={t.icon} size={16} color={t.fg} style={{ marginTop: 2 }} />
      <AppText variant="small" color={t.fg} style={{ flex: 1 }}>
        {text}
      </AppText>
    </View>
  );
};

/** The Escardia mark on a white tile, for dark backgrounds. */
export const LogoTile = ({ size = 44 }: { size?: number }) => (
    <View style={{ width: size, height: size, borderRadius: size * 0.3, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
      <Image source={require('../../assets/images/logo.png')} style={{ width: size * 0.6, height: size * 0.6 }} resizeMode="contain" />
    </View>
);

const styles = themed(() => StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.lg,
  },
  buttonLg: { height: 56, paddingHorizontal: 24 },
  buttonMd: { height: 46, paddingHorizontal: 18 },
  buttonText: { fontFamily: font.semibold, fontSize: 16 },

  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  fieldFocused: { borderColor: color.primary, borderWidth: 1.5, ...shadow.sm },
  fieldError: { borderColor: color.danger },
  fieldInput: { flex: 1, height: '100%', fontFamily: font.regular, fontSize: 15, color: color.ink, paddingVertical: 0 },
  fieldMessage: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },

  otpBox: {
    width: 48,
    height: 58,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: { borderColor: color.borderStrong },
  otpBoxActive: { borderColor: color.primary, borderWidth: 1.5, ...shadow.sm },
  otpBoxError: { borderColor: color.danger },
  otpText: { fontFamily: font.semibold, fontSize: 22, color: color.ink },
  otpHidden: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.011, color: 'transparent' },
}));

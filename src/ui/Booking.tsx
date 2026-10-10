// Building blocks for the booking and payment screens.
import React, { ReactNode, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, IconName } from './index';
import { color, gutter, radius, shadow, themed, isDark } from '../theme';

/* ------------------------------------------------------------------ */
/* Steps: Trip > Security > Payment                                    */
/* ------------------------------------------------------------------ */

const STEPS = ['Trip', 'Security', 'Payment'];

export const BookingSteps = ({ current }: { current: 1 | 2 | 3 }) => (
  <View style={styles.steps}>
    {STEPS.map((label, i) => {
      const n = i + 1;
      const done = n < current;
      const active = n === current;
      return (
        <React.Fragment key={label}>
          <View style={styles.step}>
            <View style={[styles.stepDot, (done || active) && styles.stepDotOn]}>
              {done ? (
                <Feather name="check" size={12} color="#FFFFFF" />
              ) : (
                <AppText variant="smallMedium" color={active ? '#FFFFFF' : color.muted} style={{ fontSize: 12 }}>
                  {n}
                </AppText>
              )}
            </View>
            <AppText variant="smallMedium" color={active ? color.ink : color.muted} style={{ fontSize: 13 }}>
              {label}
            </AppText>
          </View>
          {n < STEPS.length && <View style={[styles.stepLine, done && { backgroundColor: color.primary }]} />}
        </React.Fragment>
      );
    })}
  </View>
);

/* ------------------------------------------------------------------ */
/* Section title                                                       */
/* ------------------------------------------------------------------ */

export const SectionTitle = ({ title, hint }: { title: string; hint?: string }) => (
  <View style={{ marginTop: 24, marginBottom: 10 }}>
    <AppText variant="heading">{title}</AppText>
    {!!hint && (
      <AppText variant="small" color={color.muted} style={{ marginTop: 2 }}>
        {hint}
      </AppText>
    )}
  </View>
);

/* ------------------------------------------------------------------ */
/* Radio-style option card                                             */
/* ------------------------------------------------------------------ */

export const OptionCard = ({
  icon,
  title,
  subtitle,
  selected,
  onPress,
  right,
  disabled,
  children,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress?: () => void;
  right?: ReactNode;
  disabled?: boolean;
  children?: ReactNode;
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled || !onPress}
    accessibilityRole="radio"
    accessibilityState={{ selected, disabled }}
    style={[styles.option, selected && styles.optionOn, disabled && { opacity: 0.55 }]}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={[styles.optionIcon, selected && { backgroundColor: color.primary }]}>
        <Feather name={icon} size={18} color={selected ? '#FFFFFF' : color.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyMedium">{title}</AppText>
        {!!subtitle && (
          <AppText variant="small" color={color.muted} numberOfLines={2}>
            {subtitle}
          </AppText>
        )}
      </View>
      {right ?? (
        <View style={[styles.radio, selected && styles.radioOn]}>{selected && <View style={styles.radioDot} />}</View>
      )}
    </View>
    {children}
  </Pressable>
);

/* ------------------------------------------------------------------ */
/* Counter                                                             */
/* ------------------------------------------------------------------ */

export const Stepper = ({ value, onChange, min = 0, max = 20 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) => (
  <View style={styles.stepper}>
    <Pressable
      onPress={() => onChange(Math.max(min, value - 1))}
      disabled={value <= min}
      hitSlop={6}
      style={[styles.stepBtn, value <= min && { opacity: 0.35 }]}
      accessibilityLabel="Decrease"
    >
      <Feather name="minus" size={16} color={color.ink} />
    </Pressable>
    <AppText variant="subheading" style={{ minWidth: 28, textAlign: 'center' }}>
      {value}
    </AppText>
    <Pressable
      onPress={() => onChange(Math.min(max, value + 1))}
      disabled={value >= max}
      hitSlop={6}
      style={[styles.stepBtn, styles.stepBtnPlus, value >= max && { opacity: 0.35 }]}
      accessibilityLabel="Increase"
    >
      <Feather name="plus" size={16} color="#FFFFFF" />
    </Pressable>
  </View>
);

/* ------------------------------------------------------------------ */
/* Date / time field (dialog on Android, bottom sheet on iOS)          */
/* ------------------------------------------------------------------ */

export const DateTimeField = ({
  label,
  value,
  display,
  mode,
  onChange,
  minimumDate,
  error,
}: {
  label: string;
  value: Date;
  display: string;
  mode: 'date' | 'time';
  onChange: (d: Date) => void;
  minimumDate?: Date;
  error?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const insets = useSafeAreaInsets();

  return (
    <>
      <Pressable
        onPress={() => {
          setDraft(value);
          setOpen(true);
        }}
        style={[styles.dtField, error && { borderColor: color.danger }]}
      >
        <AppText variant="small" color={color.muted} style={{ fontSize: 12 }}>
          {label}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <Feather name={mode === 'date' ? 'calendar' : 'clock'} size={14} color={error ? color.danger : color.primary} />
          <AppText variant="bodyMedium" color={error ? color.danger : color.ink}>
            {display}
          </AppText>
        </View>
      </Pressable>

      {open && Platform.OS === 'android' && (
        <DateTimePicker
          value={value}
          mode={mode}
          display="default"
          minimumDate={minimumDate}
          themeVariant={isDark() ? 'dark' : 'light'}
          onChange={(e, d) => {
            setOpen(false);
            if (e.type === 'set' && d) onChange(d);
          }}
        />
      )}

      {Platform.OS !== 'android' && (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <View style={styles.sheetOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
            <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
              <View style={styles.sheetHandle} />
              <AppText variant="heading" center style={{ marginTop: 8 }}>
                {label}
              </AppText>
              <DateTimePicker
                value={draft}
                mode={mode}
                display={mode === 'date' ? 'inline' : 'spinner'}
                minimumDate={minimumDate}
                onChange={(_, d) => d && setDraft(d)}
                themeVariant={isDark() ? 'dark' : 'light'}
                accentColor={color.primary}
                style={{ alignSelf: 'stretch' }}
              />
              <Button
                title="Done"
                onPress={() => {
                  onChange(draft);
                  setOpen(false);
                }}
                style={{ marginHorizontal: gutter, marginTop: 8 }}
              />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Bottom bar with a price and the main button                         */
/* ------------------------------------------------------------------ */

export const BottomBar = ({
  label,
  amount,
  note,
  button,
}: {
  label?: string;
  amount?: string;
  note?: string;
  button: ReactNode;
}) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bottomBar, shadow.lg, { paddingBottom: insets.bottom + 12 }]}>
      {!!amount && (
        <View style={{ marginRight: 16, maxWidth: '45%' }}>
          {!!label && (
            <AppText variant="small" color={color.muted}>
              {label}
            </AppText>
          )}
          <AppText variant="heading" numberOfLines={1}>
            {amount}
          </AppText>
          {!!note && (
            <AppText variant="small" color={color.muted} numberOfLines={1} style={{ fontSize: 12 }}>
              {note}
            </AppText>
          )}
        </View>
      )}
      <View style={{ flex: 1 }}>{button}</View>
    </View>
  );
};

/* ------------------------------------------------------------------ */
/* Label / value rows                                                  */
/* ------------------------------------------------------------------ */

export const InfoRow = ({ label, value, strong, icon }: { label: string; value: ReactNode; strong?: boolean; icon?: IconName }) => (
  <View style={styles.infoRow}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 }}>
      {icon && <Feather name={icon} size={15} color={color.muted} />}
      <AppText variant={strong ? 'bodyMedium' : 'body'} color={strong ? color.ink : color.muted}>
        {label}
      </AppText>
    </View>
    {typeof value === 'string' || typeof value === 'number' ? (
      <AppText variant={strong ? 'subheading' : 'bodyMedium'} style={{ flexShrink: 1, textAlign: 'right' }}>
        {value}
      </AppText>
    ) : (
      value
    )}
  </View>
);

export const Panel = ({ children, style }: { children: ReactNode; style?: object }) => (
  <View style={[styles.panel, style]}>{children}</View>
);

const styles = themed(() => StyleSheet.create({
  steps: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: gutter, paddingBottom: 14 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: color.sunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotOn: { backgroundColor: color.primary },
  stepLine: { flex: 1, height: 2, borderRadius: 1, backgroundColor: color.border, marginHorizontal: 8 },

  option: {
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: color.border,
    backgroundColor: color.surface,
    marginBottom: 10,
  },
  optionOn: { borderColor: color.primary, backgroundColor: color.highlight },
  optionIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: color.primarySoft, alignItems: 'center', justifyContent: 'center' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: color.borderStrong, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: color.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: color.primary },

  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnPlus: { backgroundColor: color.primary, borderColor: color.primary },

  dtField: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  sheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: color.overlay },
  sheet: { backgroundColor: color.surface, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, paddingTop: 10 },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: color.border },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: gutter,
    paddingTop: 14,
    backgroundColor: color.surface,
    borderTopWidth: 1,
    borderTopColor: color.border,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16, paddingVertical: 10 },
  panel: { backgroundColor: color.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: color.border, padding: 16 },
}));

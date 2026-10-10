// Grouped menu rows (Profile, Support, Settings) and small shared bits.
import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppText, IconName } from './index';
import { color, radius, themed } from '../theme';

export const MenuGroup = ({ title, children }: { title?: string; children: ReactNode }) => (
  <View style={{ marginTop: 22 }}>
    {!!title && (
      <AppText variant="caption" color={color.muted} style={{ marginBottom: 8, marginLeft: 4 }}>
        {title}
      </AppText>
    )}
    <View style={styles.group}>{children}</View>
  </View>
);

export const MenuRow = ({
  icon,
  label,
  hint,
  onPress,
  right,
  danger,
  last,
  tint,
}: {
  icon: IconName;
  label: string;
  hint?: string;
  onPress?: () => void;
  right?: ReactNode;
  danger?: boolean;
  last?: boolean;
  tint?: string;
}) => (
  <Pressable
    onPress={onPress}
    disabled={!onPress}
    style={({ pressed }) => [styles.row, !last && styles.rowBorder, pressed && { backgroundColor: color.sunken }]}
  >
    <View style={[styles.icon, danger && { backgroundColor: color.dangerSoft }, tint ? { backgroundColor: tint } : null]}>
      <Feather name={icon} size={17} color={danger ? color.danger : color.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <AppText variant="bodyMedium" color={danger ? color.danger : color.ink}>
        {label}
      </AppText>
      {!!hint && (
        <AppText variant="small" color={color.muted} numberOfLines={2}>
          {hint}
        </AppText>
      )}
    </View>
    {right ?? (onPress ? <Feather name="chevron-right" size={18} color={color.subtle} /> : null)}
  </Pressable>
);

const styles = themed(() => StyleSheet.create({
  group: { backgroundColor: color.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: color.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: color.border },
  icon: { width: 36, height: 36, borderRadius: 11, backgroundColor: color.primarySoft, alignItems: 'center', justifyContent: 'center' },
}));

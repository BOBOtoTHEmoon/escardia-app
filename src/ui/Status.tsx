// Trip status badge and wallet transaction row.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppText } from './index';
import { naira } from './CarCard';
import { color, themed } from '../theme';

type Tone = { bg: string; fg: string; label: string };

/** Uses the database status (bookingStatus). */
export const TRIP_STATUS: Record<string, Tone> = themed(() => ({
  pending_payment: { bg: color.sunken, fg: color.muted, label: 'Awaiting payment' },
  confirmed: { bg: color.primarySoft, fg: color.primary, label: 'Upcoming' },
  ongoing: { bg: color.successSoft, fg: color.success, label: 'On the road' },
  completed: { bg: color.sunken, fg: color.text, label: 'Completed' },
  resolved: { bg: color.violetSoft, fg: color.violet, label: 'Resolved' },
  disputed: { bg: color.dangerSoft, fg: color.danger, label: 'Under review' },
  cancelled: { bg: color.sunken, fg: color.muted, label: 'Cancelled' },
  expired: { bg: color.sunken, fg: color.muted, label: 'Expired' },
}));

export const StatusPill = ({ status }: { status: string }) => {
  const t = TRIP_STATUS[status] ?? TRIP_STATUS.cancelled;
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]}>
      <View style={[styles.dot, { backgroundColor: t.fg }]} />
      <AppText variant="smallMedium" color={t.fg} style={{ fontSize: 12 }}>
        {t.label}
      </AppText>
    </View>
  );
};

/** "Starts in 2 days", "Ends in 3 hours", etc. */
export const relativeTime = (iso: string, prefix: string) => {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return '';
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${prefix} ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${prefix} ${hours} hour${hours === 1 ? '' : 's'}`;
  const days = Math.round(hours / 24);
  return `${prefix} ${days} days`;
};

export const TransactionRow = ({
  title,
  subtitle,
  amount,
  credit,
  pending,
  last,
}: {
  title: string;
  subtitle?: string;
  amount: number;
  credit: boolean;
  pending?: boolean;
  last?: boolean;
}) => (
  <View style={[styles.tx, !last && styles.txBorder]}>
    <View style={[styles.txIcon, { backgroundColor: credit ? color.successSoft : color.sunken }]}>
      <Feather name={credit ? 'arrow-down-left' : 'arrow-up-right'} size={16} color={credit ? color.success : color.text} />
    </View>
    <View style={{ flex: 1 }}>
      <AppText variant="bodyMedium" numberOfLines={1}>
        {title}
      </AppText>
      {!!subtitle && (
        <AppText variant="small" color={color.muted} numberOfLines={1}>
          {subtitle}
        </AppText>
      )}
    </View>
    <View style={{ alignItems: 'flex-end' }}>
      <AppText variant="bodyMedium" color={credit ? color.success : color.ink}>
        {credit ? '+' : '-'}
        {naira(amount)}
      </AppText>
      {pending && (
        <AppText variant="small" color={color.warning} style={{ fontSize: 11 }}>
          On hold
        </AppText>
      )}
    </View>
  </View>
);

const styles = themed(() => StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 9, height: 24, borderRadius: 12 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  tx: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  txBorder: { borderBottomWidth: 1, borderBottomColor: color.border },
  txIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
}));

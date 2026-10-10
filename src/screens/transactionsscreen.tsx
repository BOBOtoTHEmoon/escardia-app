import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, SectionList, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../config/supabase';
import { getUserTransactions, getTransactionTitle, Transaction } from '../services/walletService';
import { Chip } from '../components/filtermodal';
import { AppText, Screen, ScreenHeader } from '../ui';
import { TransactionRow } from '../ui/Status';
import { color, gutter, radius, themed, statusBarStyle } from '../theme';

type Filter = 'all' | 'credit' | 'debit';

interface TransactionsScreenProps {
  onNavigateBack: () => void;
}

const dayLabel = (d: Date) => {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (d.toDateString() === today) return 'Today';
  if (d.toDateString() === yesterday) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({ onNavigateBack }) => {
  const insets = useSafeAreaInsets();
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (uid) setTxs(await getUserTransactions(uid, 100));
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sections = useMemo(() => {
    const list = filter === 'all' ? txs : txs.filter((t) => t.type === filter);
    const groups: { title: string; data: Transaction[] }[] = [];
    list.forEach((t) => {
      const title = dayLabel(new Date(t.createdAt));
      const g = groups.find((x) => x.title === title);
      if (g) g.data.push(t);
      else groups.push({ title, data: [t] });
    });
    return groups;
  }, [txs, filter]);

  const totalIn = txs.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalOut = txs.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0);

  return (
    <Screen>
      <StatusBar style={statusBarStyle()} />
      <ScreenHeader title="Activity" onBack={onNavigateBack} />
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={color.primary} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(t) => t.id}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: insets.bottom + 32, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }
          ListHeaderComponent={
            <View>
              <View style={styles.summary}>
                <View style={{ flex: 1 }}>
                  <AppText variant="small" color={color.muted}>
                    Money in
                  </AppText>
                  <AppText variant="subheading" color={color.success}>
                    +₦{totalIn.toLocaleString('en-NG')}
                  </AppText>
                </View>
                <View style={styles.vr} />
                <View style={{ flex: 1, paddingLeft: 16 }}>
                  <AppText variant="small" color={color.muted}>
                    Money out
                  </AppText>
                  <AppText variant="subheading">-₦{totalOut.toLocaleString('en-NG')}</AppText>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                <Chip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
                <Chip label="Money in" active={filter === 'credit'} onPress={() => setFilter('credit')} />
                <Chip label="Money out" active={filter === 'debit'} onPress={() => setFilter('debit')} />
              </View>
            </View>
          }
          renderSectionHeader={({ section }) => (
            <AppText variant="caption" color={color.muted} style={{ marginTop: 22, marginBottom: 6 }}>
              {section.title}
            </AppText>
          )}
          renderItem={({ item, index, section }) => (
            <View style={[styles.rowWrap, index === 0 && styles.first, index === section.data.length - 1 && styles.last]}>
              <TransactionRow
                title={getTransactionTitle(item)}
                subtitle={[new Date(item.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }), item.description].filter(Boolean).join(' · ')}
                amount={item.amount}
                credit={item.type === 'credit'}
                pending={item.status === 'pending'}
                last={index === section.data.length - 1}
              />
            </View>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Feather name="list" size={24} color={color.subtle} />
              <AppText variant="bodyMedium" style={{ marginTop: 10 }}>
                Nothing here yet
              </AppText>
            </View>
          }
        />
      )}
    </Screen>
  );
};

const styles = themed(() => StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: radius.xl, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border },
  vr: { width: 1, height: 36, backgroundColor: color.border },
  rowWrap: { backgroundColor: color.surface, paddingHorizontal: 14, borderLeftWidth: 1, borderRightWidth: 1, borderColor: color.border },
  first: { borderTopWidth: 1, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingTop: 2 },
  last: { borderBottomWidth: 1, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl, paddingBottom: 2 },
}));

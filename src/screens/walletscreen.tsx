import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { auth } from '../config/supabase';
import { getOrCreateWallet, getRecentTransactions, getTransactionTitle, Transaction, Wallet } from '../services/walletService';
import { AppText, Button, Screen, ScreenHeader } from '../ui';
import { Panel } from '../ui/Booking';
import { naira } from '../ui/CarCard';
import { TransactionRow } from '../ui/Status';
import { brand, color, gutter, radius, themed, statusBarStyle } from '../theme';

interface WalletScreenProps {
  onNavigateBack: () => void;
  onNavigateToTransactions: () => void;
  onNavigateToAddMoney?: () => void;
}

export const txDate = (iso: any) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ', ' + new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

export const WalletScreen: React.FC<WalletScreenProps> = ({ onNavigateBack, onNavigateToTransactions, onNavigateToAddMoney }) => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (uid) {
      const [w, t] = await Promise.all([getOrCreateWallet(uid), getRecentTransactions(uid, 6)]);
      setWallet(w);
      setTxs(t);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen>
      <StatusBar style={statusBarStyle()} />
      <ScreenHeader title="Wallet" onBack={onNavigateBack} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
      >
        <View style={styles.card}>
          <View style={styles.glow} />
          <View style={styles.ring} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <AppText variant="small" color={color.onDarkMuted}>
              Available balance
            </AppText>
            <View style={styles.ngn}>
              <AppText variant="smallMedium" color="#FFFFFF" style={{ fontSize: 11 }}>
                NGN
              </AppText>
            </View>
          </View>
          <AppText variant="display" color="#FFFFFF" style={{ marginTop: 8 }}>
            {loading ? '…' : naira(wallet?.balance ?? 0)}
          </AppText>
          {!!wallet?.pending && (
            <AppText variant="small" color={color.onDarkMuted} style={{ marginTop: 2 }}>
              {naira(wallet.pending)} on hold
            </AppText>
          )}
          <Button title="Add money" variant="white" icon="plus" size="md" onPress={onNavigateToAddMoney} style={{ marginTop: 20, alignSelf: 'flex-start' }} />
        </View>

        <View style={styles.tips}>
          {[
            { icon: 'zap' as const, title: 'Pay instantly', body: 'Book without a card or bank app.' },
            { icon: 'rotate-ccw' as const, title: 'Refunds land here', body: 'Cancelled trips are refunded to your wallet.' },
          ].map((t) => (
            <View key={t.title} style={styles.tip}>
              <View style={styles.tipIcon}>
                <Feather name={t.icon} size={15} color={color.primary} />
              </View>
              <AppText variant="smallMedium" style={{ marginTop: 10 }}>
                {t.title}
              </AppText>
              <AppText variant="small" color={color.muted} style={{ marginTop: 2 }}>
                {t.body}
              </AppText>
            </View>
          ))}
        </View>

        <View style={styles.sectionHead}>
          <AppText variant="heading">Recent activity</AppText>
          {txs.length > 0 && (
            <Pressable onPress={onNavigateToTransactions} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <AppText variant="smallMedium" color={color.primary} style={{ fontSize: 14 }}>
                See all
              </AppText>
              <Feather name="chevron-right" size={16} color={color.primary} />
            </Pressable>
          )}
        </View>

        <Panel style={{ paddingVertical: 4 }}>
          {loading ? (
            <View style={{ height: 120 }} />
          ) : txs.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 28 }}>
              <Feather name="list" size={22} color={color.subtle} />
              <AppText variant="bodyMedium" style={{ marginTop: 10 }}>
                No activity yet
              </AppText>
              <AppText variant="small" color={color.muted} center style={{ marginTop: 4 }}>
                Top-ups, payments and refunds will show here.
              </AppText>
            </View>
          ) : (
            txs.map((t, i) => (
              <TransactionRow
                key={t.id}
                title={getTransactionTitle(t)}
                subtitle={txDate(t.createdAt)}
                amount={t.amount}
                credit={t.type === 'credit'}
                pending={t.status === 'pending'}
                last={i === txs.length - 1}
              />
            ))
          )}
        </Panel>

        <AppText variant="small" color={color.muted} center style={{ marginTop: 18, paddingHorizontal: 12 }}>
          Wallet money can be used for bookings. Questions about your balance? Contact support from your profile.
        </AppText>
      </ScrollView>
    </Screen>
  );
};

const styles = themed(() => StyleSheet.create({
  card: { padding: 22, borderRadius: radius.xl, backgroundColor: color.navy, overflow: 'hidden' },
  glow: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: brand[600], opacity: 0.35, right: -80, top: -120 },
  ring: { position: 'absolute', width: 180, height: 180, borderRadius: 90, borderWidth: 24, borderColor: 'rgba(255,255,255,0.04)', left: -60, bottom: -100 },
  ngn: { paddingHorizontal: 8, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center' },
  tips: { flexDirection: 'row', gap: 10, marginTop: 14 },
  tip: { flex: 1, padding: 14, borderRadius: radius.lg, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border },
  tipIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: color.primarySoft, alignItems: 'center', justifyContent: 'center' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 10 },
}));

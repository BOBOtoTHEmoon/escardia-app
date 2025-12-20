// ============================================
// ESCARDIA - WALLET SCREEN (Updated)
// File: src/screens/WalletScreen.tsx
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../constants';
import { auth } from '../config/firebase';
import {
  getOrCreateWallet,
  getRecentTransactions,
  formatAmount,
  formatTransactionDate,
  getTransactionTitle,
  getTransactionSubtitle,
  Wallet,
  Transaction,
} from '../services/walletService';

interface WalletScreenProps {
  onNavigateBack: () => void;
  onNavigateToTransactions: () => void;
  onNavigateToAddMoney?: () => void;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({
  onNavigateBack,
  onNavigateToTransactions,
  onNavigateToAddMoney,
}) => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load wallet data
  const loadWalletData = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('No user logged in');
        setLoading(false);
        return;
      }

      // Load wallet
      const walletData = await getOrCreateWallet(user.uid);
      setWallet(walletData);

      // Load recent transactions
      const recentTxns = await getRecentTransactions(user.uid, 5);
      setTransactions(recentTxns);
    } catch (error) {
      console.error('Error loading wallet data:', error);
      Alert.alert('Error', 'Failed to load wallet data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadWalletData();
  };

  // Handle add money press
  const handleAddMoney = () => {
    if (onNavigateToAddMoney) {
      onNavigateToAddMoney();
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wallet</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading wallet...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Wallet Card */}
        <View style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <Text style={styles.walletLabel}>Available Balance</Text>
            <View style={styles.walletBadge}>
              <Text style={styles.walletBadgeText}>NGN</Text>
            </View>
          </View>

          <Text style={styles.walletBalance}>
            ₦{formatAmount(wallet?.balance || 0)}
          </Text>

          <View style={styles.walletActions}>
            <TouchableOpacity style={styles.addMoneyButton} onPress={handleAddMoney}>
              <Text style={styles.addMoneyIcon}>+</Text>
              <Text style={styles.addMoneyText}>Add Money</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionItem} onPress={handleAddMoney}>
              <View style={[styles.actionIcon, { backgroundColor: '#10B981' + '20' }]}>
                <Text style={styles.actionIconText}>💳</Text>
              </View>
              <Text style={styles.actionLabel}>Add Money</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={onNavigateToTransactions}>
              <View style={[styles.actionIcon, { backgroundColor: '#3B82F6' + '20' }]}>
                <Text style={styles.actionIconText}>📊</Text>
              </View>
              <Text style={styles.actionLabel}>History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => Alert.alert('Coming Soon', 'Send money feature coming soon!')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#8B5CF6' + '20' }]}>
                <Text style={styles.actionIconText}>📤</Text>
              </View>
              <Text style={styles.actionLabel}>Send</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => Alert.alert('Help', 'Contact support@escardia.com for wallet issues.')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#F59E0B' + '20' }]}>
                <Text style={styles.actionIconText}>❓</Text>
              </View>
              <Text style={styles.actionLabel}>Help</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>💡</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Pay faster with your wallet</Text>
            <Text style={styles.infoText}>
              Add money to your wallet and enjoy instant payments when booking cars.
            </Text>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <View style={styles.activityHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {transactions.length > 0 && (
              <TouchableOpacity onPress={onNavigateToTransactions}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            )}
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyTransactions}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Transactions Yet</Text>
              <Text style={styles.emptyText}>
                Add money to your wallet to get started
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={handleAddMoney}>
                <Text style={styles.emptyButtonText}>+ Add Money</Text>
              </TouchableOpacity>
            </View>
          ) : (
            transactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View
                  style={[
                    styles.transactionIcon,
                    transaction.type === 'credit'
                      ? styles.transactionIconCredit
                      : styles.transactionIconDebit,
                  ]}
                >
                  <Text style={styles.transactionIconText}>
                    {transaction.type === 'credit' ? '↓' : '↑'}
                  </Text>
                </View>

                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionTitle} numberOfLines={1}>
                    {getTransactionTitle(transaction)}
                  </Text>
                  <Text style={styles.transactionSubtitle}>
                    {getTransactionSubtitle(transaction)}
                  </Text>
                </View>

                <View style={styles.transactionRight}>
                  <Text
                    style={[
                      styles.transactionAmount,
                      transaction.type === 'credit'
                        ? styles.creditAmount
                        : styles.debitAmount,
                    ]}
                  >
                    {transaction.type === 'credit' ? '+' : '-'}₦
                    {formatAmount(transaction.amount)}
                  </Text>
                  <Text style={styles.transactionTime}>
                    {formatTransactionDate(transaction.createdAt)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  backIcon: {
    fontSize: 24,
    color: '#000',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Wallet Card
  walletCard: {
    backgroundColor: '#1E3A8A',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  walletLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  walletBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  walletBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  walletBalance: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    marginTop: 8,
  },
  walletActions: {
    flexDirection: 'row',
  },
  addMoneyButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMoneyIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    marginRight: 8,
    fontWeight: 'bold',
  },
  addMoneyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Quick Actions
  quickActionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionItem: {
    width: '23%',
    alignItems: 'center',
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionIconText: {
    fontSize: 22,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#3B82F6',
    lineHeight: 18,
  },

  // Activity Section
  activitySection: {
    marginBottom: 24,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  emptyTransactions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  transactionIconCredit: {
    backgroundColor: '#D1FAE5',
  },
  transactionIconDebit: {
    backgroundColor: '#FEE2E2',
  },
  transactionIconText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  transactionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  creditAmount: {
    color: '#10B981',
  },
  debitAmount: {
    color: '#EF4444',
  },
  transactionTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default WalletScreen;
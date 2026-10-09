import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../constants';
import { auth } from '../config/supabase';
import {
  getUserTransactions,
  formatAmount,
  formatFullDate,
  getTransactionTitle,
  getTransactionSubtitle,
  Transaction,
} from '../services/walletService';

interface TransactionsScreenProps {
  onNavigateBack: () => void;
}

type FilterType = 'all' | 'credit' | 'debit';

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({
  onNavigateBack,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Load transactions
  const loadTransactions = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      const txns = await getUserTransactions(user.uid, 50);
      setTransactions(txns);
      filterTransactions(txns, activeFilter);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Filter transactions
  const filterTransactions = (txns: Transaction[], filter: FilterType) => {
    if (filter === 'all') {
      setFilteredTransactions(txns);
    } else {
      setFilteredTransactions(txns.filter((t) => t.type === filter));
    }
  };

  // Handle filter change
  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    filterTransactions(transactions, filter);
  };

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  // Group transactions by date
  const groupTransactionsByDate = (txns: Transaction[]) => {
    const groups: { [key: string]: Transaction[] } = {};

    txns.forEach((txn) => {
      const date = txn.createdAt?.toDate
        ? txn.createdAt.toDate()
        : new Date(txn.createdAt);
      
      const dateKey = date.toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(txn);
    });

    return Object.entries(groups).map(([date, items]) => ({
      date,
      data: items,
    }));
  };

  // Render transaction item
  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionItem}>
      <View
        style={[
          styles.transactionIcon,
          item.type === 'credit'
            ? styles.transactionIconCredit
            : styles.transactionIconDebit,
        ]}
      >
        <Text style={styles.transactionIconText}>
          {item.type === 'credit' ? '↓' : '↑'}
        </Text>
      </View>

      <View style={styles.transactionDetails}>
        <Text style={styles.transactionTitle} numberOfLines={1}>
          {getTransactionTitle(item)}
        </Text>
        <Text style={styles.transactionSubtitle}>
          {getTransactionSubtitle(item)}
        </Text>
        <Text style={styles.transactionRef}>Ref: {item.reference}</Text>
      </View>

      <View style={styles.transactionRight}>
        <Text
          style={[
            styles.transactionAmount,
            item.type === 'credit' ? styles.creditAmount : styles.debitAmount,
          ]}
        >
          {item.type === 'credit' ? '+' : '-'}₦{formatAmount(item.amount)}
        </Text>
        <View
          style={[
            styles.statusBadge,
            item.status === 'completed'
              ? styles.statusCompleted
              : item.status === 'pending'
              ? styles.statusPending
              : styles.statusFailed,
          ]}
        >
          <Text style={styles.statusText}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>
    </View>
  );

  // Render section header
  const renderSectionHeader = (date: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{date}</Text>
    </View>
  );

  // Calculate totals
  const totalCredit = transactions
    .filter((t) => t.type === 'credit' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebit = transactions
    .filter((t) => t.type === 'debit' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transactions</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  const groupedTransactions = groupTransactionsByDate(filteredTransactions);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transactions</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, styles.summaryCardCredit]}>
          <Text style={styles.summaryLabel}>Total In</Text>
          <Text style={[styles.summaryAmount, styles.creditAmount]}>
            +₦{formatAmount(totalCredit)}
          </Text>
        </View>
        <View style={[styles.summaryCard, styles.summaryCardDebit]}>
          <Text style={styles.summaryLabel}>Total Out</Text>
          <Text style={[styles.summaryAmount, styles.debitAmount]}>
            -₦{formatAmount(totalDebit)}
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'credit', 'debit'] as FilterType[]).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              activeFilter === filter && styles.filterTabActive,
            ]}
            onPress={() => handleFilterChange(filter)}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === filter && styles.filterTabTextActive,
              ]}
            >
              {filter === 'all' ? 'All' : filter === 'credit' ? 'Money In' : 'Money Out'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No Transactions</Text>
          <Text style={styles.emptyText}>
            {activeFilter === 'all'
              ? 'Your transaction history will appear here'
              : `No ${activeFilter === 'credit' ? 'incoming' : 'outgoing'} transactions`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={groupedTransactions}
          keyExtractor={(item) => item.date}
          renderItem={({ item }) => (
            <View>
              {renderSectionHeader(item.date)}
              {item.data.map((txn) => (
                <View key={txn.id}>{renderTransaction({ item: txn })}</View>
              ))}
            </View>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Summary Cards
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
  },
  summaryCardCredit: {
    backgroundColor: '#D1FAE5',
  },
  summaryCardDebit: {
    backgroundColor: '#FEE2E2',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '700',
  },

  // Filter Tabs
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundGray,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },

  // List
  listContent: {
    padding: 20,
    paddingTop: 8,
  },
  sectionHeader: {
    paddingVertical: 12,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  // Transaction Item
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
    marginBottom: 2,
  },
  transactionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  transactionRef: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  creditAmount: {
    color: '#10B981',
  },
  debitAmount: {
    color: '#EF4444',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusCompleted: {
    backgroundColor: '#D1FAE5',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusFailed: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#374151',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 50,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default TransactionsScreen;
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';

interface TransactionsScreenProps {
  onNavigateBack: () => void;
}

interface Transaction {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
  time: string;
  type: 'credit' | 'debit';
}

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({ onNavigateBack }) => {
  // Mock transactions - replace with actual data
  const transactions: Transaction[] = [
    {
      id: '1',
      title: 'Payment for Range Rover S...',
      subtitle: 'Payment with card',
      amount: '₦270,000',
      time: '02:33AM',
      type: 'debit',
    },
    {
      id: '2',
      title: 'Escardia wallet credited',
      subtitle: 'Payment with card',
      amount: '₦300,000',
      time: '05:33PM',
      type: 'credit',
    },
    {
      id: '3',
      title: 'Payment for Lamborghini...',
      subtitle: 'Payment with USSD',
      amount: '₦400,000',
      time: '08:33AM',
      type: 'debit',
    },
    {
      id: '4',
      title: 'Escardia wallet credited',
      subtitle: 'Payment with card',
      amount: '₦400,000',
      time: '06:33PM',
      type: 'credit',
    },
    {
      id: '5',
      title: 'Payment for Range Rover 2...',
      subtitle: 'Payment with card',
      amount: '₦270,000',
      time: '02:33AM',
      type: 'debit',
    },
    {
      id: '6',
      title: 'Escardia wallet credited',
      subtitle: 'Payment with card',
      amount: '₦300,000',
      time: '05:33PM',
      type: 'credit',
    },
    {
      id: '7',
      title: 'Payment for Lamborghini...',
      subtitle: 'Payment with USSD',
      amount: '₦400,000',
      time: '08:33AM',
      type: 'debit',
    },
    {
      id: '8',
      title: 'Escardia wallet credited',
      subtitle: 'Payment with card',
      amount: '₦400,000',
      time: '06:33PM',
      type: 'credit',
    },
  ];

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

      <ScrollView style={styles.content}>
        {transactions.map((transaction) => (
          <View key={transaction.id} style={styles.transactionItem}>
            <View style={styles.transactionIcon}>
              <Image
                source={require('../../assets/images/transaction.png')}
                style={styles.transactionIconImage}
                resizeMode="contain"
              />
            </View>
            
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionTitle}>{transaction.title}</Text>
              <Text style={styles.transactionSubtitle}>{transaction.subtitle}</Text>
            </View>
            
            <View style={styles.transactionRight}>
              <Text style={[
                styles.transactionAmount,
                transaction.type === 'credit' ? styles.creditAmount : styles.debitAmount
              ]}>
                {transaction.amount}
              </Text>
              <Text style={styles.transactionTime}>{transaction.time}</Text>
            </View>
          </View>
        ))}
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
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
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
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIconImage: {
    width: 20,
    height: 20,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  transactionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
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
    color: '#6B7280',
  },
});
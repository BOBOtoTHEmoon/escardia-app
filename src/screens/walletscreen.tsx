import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';

interface WalletScreenProps {
  onNavigateBack: () => void;
  onNavigateToTransactions: () => void;
}

interface Transaction {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
  time: string;
  type: 'credit' | 'debit';
  icon: string;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({
  onNavigateBack,
  onNavigateToTransactions,
}) => {
  // Mock wallet balance - replace with actual data from your backend
  const walletBalance = '250,000.69';

  // Recent transactions - replace with actual data
  const recentTransactions: Transaction[] = [
    {
      id: '1',
      title: 'Payment for Range Rover S...',
      subtitle: 'Payment with card',
      amount: '₦270,000',
      time: '02:33AM',
      type: 'debit',
      icon: 'card',
    },
    {
      id: '2',
      title: 'Escardia wallet credited',
      subtitle: 'Payment with card',
      amount: '₦300,000',
      time: '06:33PM',
      type: 'credit',
      icon: 'wallet',
    },
    {
      id: '3',
      title: 'Payment for Lamborghini...',
      subtitle: 'Payment with Wallet',
      amount: '₦400,000',
      time: '08:33AM',
      type: 'debit',
      icon: 'wallet',
    },
    {
      id: '4',
      title: 'Escardia wallet credited',
      subtitle: 'Payment with card',
      amount: '₦400,000',
      time: '06:33PM',
      type: 'credit',
      icon: 'card',
    },
  ];

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

      <ScrollView style={styles.content}>
        {/* Wallet Card */}
        <View style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <Text style={styles.walletLabel}>NGN Wallet</Text>
            <TouchableOpacity>
              <Image
                source={require('../../assets/images/edit.png')}
                style={styles.editIcon}
                resizeMode="contain"
              />
                <TouchableOpacity> 
                  <Image
                  source={require('../../assets/images/headerpattern.png')}
                  style={styles.promoPattern}
                  resizeMode="contain"
                />
                </TouchableOpacity>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.walletBalance}>₦{walletBalance}</Text>
          
          <TouchableOpacity style={styles.addMoneyButton}>
            <Text style={styles.addMoneyText}>Add Money</Text>
          </TouchableOpacity>
        </View>

        {/* Bank Account Details */}
        <View style={styles.bankSection}>
          <Text style={styles.sectionTitle}>Bank Account Details</Text>
          
          <View style={styles.bankDetails}>
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Bank Name</Text>
              <Text style={styles.bankValue}>Keystone Bank</Text>
            </View>
            
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Account Number</Text>
              <View style={styles.accountNumberRow}>
                <Text style={styles.bankValue}>0865221746</Text>
                <TouchableOpacity>
                  <Image
                    source={require('../../assets/images/copy.png')}
                    style={styles.copyIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <View style={styles.activityHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={onNavigateToTransactions}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.map((transaction) => (
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
        </View>
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
  walletCard: {
    backgroundColor: '#1E3A8A',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  walletLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  editIcon: {
    width: 20,
    height: 20,
    tintColor: '#FFFFFF',
  },
  walletBalance: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  addMoneyButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addMoneyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bankSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  bankDetails: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  bankRow: {
    marginBottom: 16,
  },
  bankLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  bankValue: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
  accountNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  copyIcon: {
    width: 16,
    height: 16,
  },
  activitySection: {
    marginBottom: 24,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
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
  promoPattern: {
  position: 'absolute',
  width: '90%',
  height: '200%',
  right: -49,
  opacity: 1,
   },
});
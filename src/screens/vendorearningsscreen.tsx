import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius } from '../constants';

interface VendorEarningsScreenProps {
  onNavigateToDashboard: () => void;
  onNavigateToFleet: () => void;
  onNavigateToBookings: () => void;
  onNavigateToProfile: () => void;
}

export const VendorEarningsScreen: React.FC<VendorEarningsScreenProps> = ({
  onNavigateToDashboard,
  onNavigateToFleet,
  onNavigateToBookings,
  onNavigateToProfile,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [earnings, setEarnings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        console.log('🔵 Loading earnings data...');
        const { auth } = await import('../config/firebase');
        const vendorId = auth.currentUser?.uid;

        if (!vendorId) {
          console.log('❌ No vendor logged in');
          setLoading(false);
          return;
        }

        // Fetch bookings to calculate earnings
        const { getVendorBookings } = await import('../services/bookingService');
        const result = await getVendorBookings(vendorId);

        if (result.success && result.bookings) {
          const bookings = result.bookings;
          
          // Calculate total earnings
          const totalEarnings = bookings.reduce((sum: number, booking: any) => {
            return sum + (booking.totalPrice || 0);
          }, 0);

          // Calculate completed bookings earnings
          const completedBookings = bookings.filter((b: any) => b.status === 'past' || b.status === 'completed');
          const completedEarnings = completedBookings.reduce((sum: number, booking: any) => {
            return sum + (booking.totalPrice || 0);
          }, 0);

          // Calculate pending earnings (upcoming/ongoing)
          const pendingEarnings = totalEarnings - completedEarnings;

          setEarnings({
            total: totalEarnings,
            completed: completedEarnings,
            pending: pendingEarnings,
            totalBookings: bookings.length,
            completedBookings: completedBookings.length,
            recentTransactions: bookings.slice(0, 10), // Last 10 bookings
          });

          console.log('✅ Earnings loaded');
        }
      } catch (error) {
        console.error('❌ Error loading earnings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, [selectedPeriod]);

  const periodData = {
    week: { label: 'This Week', earnings: earnings?.total || 0 },
    month: { label: 'This Month', earnings: earnings?.total || 0 },
    year: { label: 'This Year', earnings: earnings?.total || 0 },
  };

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#2F5FED', '#1E3A8A', '#0F3460']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <Image
            source={require('../../assets/images/headerpattern.png')}
            style={styles.headerPattern}
            resizeMode="cover"
          />
        </LinearGradient>

        <Text style={styles.headerTitle}>Earnings</Text>
      </View>

      {/* Content Wrapper */}
      <View style={styles.contentWrapper}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading earnings...</Text>
            </View>
          ) : (
            <>
              {/* Period Selector */}
              <View style={styles.periodSelector}>
                <TouchableOpacity
                  style={[styles.periodTab, selectedPeriod === 'week' && styles.periodTabActive]}
                  onPress={() => setSelectedPeriod('week')}
                >
                  <Text style={[styles.periodText, selectedPeriod === 'week' && styles.periodTextActive]}>
                    Week
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.periodTab, selectedPeriod === 'month' && styles.periodTabActive]}
                  onPress={() => setSelectedPeriod('month')}
                >
                  <Text style={[styles.periodText, selectedPeriod === 'month' && styles.periodTextActive]}>
                    Month
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.periodTab, selectedPeriod === 'year' && styles.periodTabActive]}
                  onPress={() => setSelectedPeriod('year')}
                >
                  <Text style={[styles.periodText, selectedPeriod === 'year' && styles.periodTextActive]}>
                    Year
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Total Earnings Card */}
              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>{periodData[selectedPeriod].label}</Text>
                <Text style={styles.totalAmount}>
                  ₦{periodData[selectedPeriod].earnings.toLocaleString()}
                </Text>
                <Text style={styles.totalSubtext}>Total Earnings</Text>
              </View>

              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <View style={styles.statIcon}>
                    <Text style={styles.statIconText}>✅</Text>
                  </View>
                  <Text style={styles.statValue}>₦{earnings?.completed.toLocaleString() || '0'}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>

                <View style={styles.statCard}>
                  <View style={styles.statIcon}>
                    <Text style={styles.statIconText}>⏳</Text>
                  </View>
                  <Text style={styles.statValue}>₦{earnings?.pending.toLocaleString() || '0'}</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>

                <View style={styles.statCard}>
                  <View style={styles.statIcon}>
                    <Text style={styles.statIconText}>📊</Text>
                  </View>
                  <Text style={styles.statValue}>{earnings?.totalBookings || 0}</Text>
                  <Text style={styles.statLabel}>Total Bookings</Text>
                </View>

                <View style={styles.statCard}>
                  <View style={styles.statIcon}>
                    <Text style={styles.statIconText}>💰</Text>
                  </View>
                  <Text style={styles.statValue}>
                    ₦{earnings?.totalBookings > 0 
                      ? Math.round(earnings.total / earnings.totalBookings).toLocaleString() 
                      : '0'}
                  </Text>
                  <Text style={styles.statLabel}>Avg. Per Booking</Text>
                </View>
              </View>

              {/* Recent Transactions */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>

                {earnings?.recentTransactions && earnings.recentTransactions.length > 0 ? (
                  <View style={styles.transactionsList}>
                    {earnings.recentTransactions.map((booking: any) => (
                      <View key={booking.id} style={styles.transactionCard}>
                        <View style={styles.transactionIcon}>
                          <Text style={styles.transactionIconText}>🚗</Text>
                        </View>
                        <View style={styles.transactionInfo}>
                          <Text style={styles.transactionTitle}>
                            {booking.car?.brand} {booking.car?.model}
                          </Text>
                          <Text style={styles.transactionDate}>
                            {booking.startDate} - {booking.endDate}
                          </Text>
                          <Text style={styles.transactionCustomer}>
                            {booking.customerName || 'Customer'}
                          </Text>
                        </View>
                        <View style={styles.transactionAmount}>
                          <Text style={styles.transactionValue}>
                            ₦{booking.totalPrice?.toLocaleString() || '0'}
                          </Text>
                          <View
                            style={[
                              styles.transactionStatus,
                              {
                                backgroundColor:
                                  booking.status === 'past' || booking.status === 'completed'
                                    ? '#10B981'
                                    : booking.status === 'ongoing'
                                    ? '#F59E0B'
                                    : '#3B82F6',
                              },
                            ]}
                          >
                            <Text style={styles.transactionStatusText}>
                              {booking.status === 'past' || booking.status === 'completed'
                                ? 'Paid'
                                : booking.status === 'ongoing'
                                ? 'Ongoing'
                                : 'Pending'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>💸</Text>
                    <Text style={styles.emptyText}>No transactions yet</Text>
                  </View>
                )}
              </View>
            </>
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={onNavigateToDashboard}>
          <Image
            source={require('../../assets/images/homeicon.png')}
            style={styles.navIcon}
            resizeMode="contain"
          />
          <Text style={styles.navLabel}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={onNavigateToFleet}>
          <Image
            source={require('../../assets/images/caricon.png')}
            style={styles.navIcon}
            resizeMode="contain"
          />
          <Text style={styles.navLabel}>Fleet</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={onNavigateToBookings}>
          <Image
            source={require('../../assets/images/tripicon.png')}
            style={styles.navIcon}
            resizeMode="contain"
          />
          <Text style={styles.navLabel}>Bookings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Image
            source={require('../../assets/images/walleticon.png')}
            style={styles.navIconActive}
            resizeMode="contain"
          />
          <Text style={styles.navLabelActive}>Earnings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={onNavigateToProfile}>
          <Image
            source={require('../../assets/images/profileicon.png')}
            style={styles.navIcon}
            resizeMode="contain"
          />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
 header: {
    paddingTop: 80,
paddingBottom: 60,
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  headerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  headerPattern: {
    position: 'absolute',
    width: '80%',
    height: '100%',
    right: -50,
    opacity: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
        top: 30,
  },
  contentWrapper: {
    flex: 1,
    marginTop: -20,
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  loadingContainer: {
    paddingVertical: spacing['3xl'],
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  periodTab: {
    flex: 1,
    backgroundColor: colors.inputBackground,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  periodTabActive: {
    backgroundColor: colors.primary,
  },
  periodText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  periodTextActive: {
    color: colors.textWhite,
    fontWeight: typography.fontWeight.semiBold,
  },
  totalCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  totalLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textWhite,
    opacity: 0.9,
    marginBottom: spacing.xs,
  },
  totalAmount: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    marginBottom: spacing.xs,
  },
  totalSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textWhite,
    opacity: 0.8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statIconText: {
    fontSize: 24,
  },
  statValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  transactionsList: {
    gap: spacing.sm,
  },
  transactionCard: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  transactionIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  transactionIconText: {
    fontSize: 20,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  transactionCustomer: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  transactionStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  transactionStatusText: {
    fontSize: typography.fontSize.xs,
    color: colors.textWhite,
    fontWeight: typography.fontWeight.semiBold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  bottomSpacing: {
    height: 100,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingBottom: 20,
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navIcon: {
    width: 24,
    height: 24,
    marginBottom: spacing.xs,
    opacity: 0.5,
  },
  navIconActive: {
    width: 24,
    height: 24,
    marginBottom: spacing.xs,
  },
  navLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  navLabelActive: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.semiBold,
  },
});
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../constants';

interface VendorAnalyticsScreenProps {
  onNavigateBack: () => void;
}

export const VendorAnalyticsScreen: React.FC<VendorAnalyticsScreenProps> = ({
  onNavigateBack,
}) => {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    averageRating: 0,
    completionRate: 0,
    topCar: { name: 'N/A', bookings: 0 },
    revenueGrowth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [timeframe]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const { auth, db } = await import('../config/firebase');
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      
      const vendorId = auth.currentUser?.uid;
      if (!vendorId) return;

      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      if (timeframe === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (timeframe === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      } else {
        startDate.setFullYear(now.getFullYear() - 1);
      }

      // Fetch bookings
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('vendorId', '==', vendorId)
      );
      
      const snapshot = await getDocs(bookingsQuery);
      const bookings = snapshot.docs.map(doc => doc.data());

      // Filter by timeframe
      const filteredBookings = bookings.filter((b: any) => {
        const bookingDate = new Date(b.createdAt);
        return bookingDate >= startDate;
      });

      // Calculate metrics
      const totalRevenue = filteredBookings
        .filter((b: any) => b.status === 'completed')
        .reduce((sum, b: any) => sum + (b.totalPrice || 0), 0);

      const totalBookings = filteredBookings.length;

      const completedBookings = filteredBookings.filter((b: any) => b.status === 'completed');
      const completionRate = totalBookings > 0 
        ? Math.round((completedBookings.length / totalBookings) * 100)
        : 0;

      // Find top car
      const carBookings: { [key: string]: number } = {};
      filteredBookings.forEach((b: any) => {
        const carKey = `${b.car?.brand} ${b.car?.model}`;
        carBookings[carKey] = (carBookings[carKey] || 0) + 1;
      });

      const topCarEntry = Object.entries(carBookings).sort((a, b) => b[1] - a[1])[0];
      const topCar = topCarEntry 
        ? { name: topCarEntry[0], bookings: topCarEntry[1] }
        : { name: 'N/A', bookings: 0 };

      setAnalytics({
        totalRevenue,
        totalBookings,
        averageRating: 4.8, // TODO: Calculate from reviews
        completionRate,
        topCar,
        revenueGrowth: 15, // TODO: Calculate actual growth
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Timeframe Selector */}
      <View style={styles.timeframeContainer}>
        <TouchableOpacity
          style={[styles.timeframeButton, timeframe === 'week' && styles.timeframeButtonActive]}
          onPress={() => setTimeframe('week')}
        >
          <Text style={[styles.timeframeText, timeframe === 'week' && styles.timeframeTextActive]}>
            Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timeframeButton, timeframe === 'month' && styles.timeframeButtonActive]}
          onPress={() => setTimeframe('month')}
        >
          <Text style={[styles.timeframeText, timeframe === 'month' && styles.timeframeTextActive]}>
            Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timeframeButton, timeframe === 'year' && styles.timeframeButtonActive]}
          onPress={() => setTimeframe('year')}
        >
          <Text style={[styles.timeframeText, timeframe === 'year' && styles.timeframeTextActive]}>
            Year
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Revenue Card */}
          <View style={styles.bigCard}>
            <Text style={styles.bigCardLabel}>Total Revenue</Text>
            <Text style={styles.bigCardValue}>₦{analytics.totalRevenue.toLocaleString()}</Text>
            <View style={styles.growthIndicator}>
              <Text style={styles.growthText}>↑ {analytics.revenueGrowth}% vs last {timeframe}</Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>📊</Text>
              <Text style={styles.statValue}>{analytics.totalBookings}</Text>
              <Text style={styles.statLabel}>Total Bookings</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>⭐</Text>
              <Text style={styles.statValue}>{analytics.averageRating}</Text>
              <Text style={styles.statLabel}>Avg Rating</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>✓</Text>
              <Text style={styles.statValue}>{analytics.completionRate}%</Text>
              <Text style={styles.statLabel}>Completion</Text>
            </View>
          </View>

          {/* Top Performer */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 Top Performing Car</Text>
            <View style={styles.topCarCard}>
              <View>
                <Text style={styles.topCarName}>{analytics.topCar.name}</Text>
                <Text style={styles.topCarBookings}>
                  {analytics.topCar.bookings} bookings this {timeframe}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
  },
  backIcon: {
    fontSize: 24,
    color: colors.text,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  timeframeContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
  },
  timeframeButtonActive: {
    backgroundColor: colors.primary,
  },
  timeframeText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  timeframeTextActive: {
    color: colors.textWhite,
    fontWeight: typography.fontWeight.semiBold,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  bigCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  bigCardLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textWhite,
    opacity: 0.9,
    marginBottom: spacing.xs,
  },
  bigCardValue: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    marginBottom: spacing.sm,
  },
  growthIndicator: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  growthText: {
    fontSize: typography.fontSize.sm,
    color: colors.textWhite,
    fontWeight: typography.fontWeight.medium,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 30,
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
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
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  topCarCard: {
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  topCarName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  topCarBookings: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  bottomSpacing: {
    height: 40,
  },
});
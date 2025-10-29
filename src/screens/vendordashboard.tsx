import React, { useState, useEffect } from 'react'; // ✅ Update this line
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

interface VendorDashboardScreenProps {
  vendorName: string;
  onNavigateToFleet: () => void;
  onNavigateToBookings: () => void;
   onNavigateToBookingDetails: (bookingId: string) => void;
  onNavigateToEarnings: () => void;
  onNavigateToDrivers: () => void;
  onNavigateToProfile: () => void;
  onNavigateToNotifications: () => void; 
   onNavigateToWithdrawFunds: () => void;
  onAddCar: () => void;
  hasUnreadNotifications?: boolean; 
}

export const VendorDashboardScreen: React.FC<VendorDashboardScreenProps> = ({
  vendorName,
  onNavigateToFleet,
  onNavigateToBookings,
   onNavigateToBookingDetails,
  onNavigateToEarnings,
  onNavigateToDrivers,
  onNavigateToProfile,
  onNavigateToNotifications,
  onNavigateToWithdrawFunds, 
  onAddCar,
  hasUnreadNotifications,
}) => {
  const [stats, setStats] = useState({
    totalCars: 0,
    activeBookings: 0,
    totalEarnings: 0,
    thisMonthEarnings: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
 const [dashboardData, setDashboardData] = useState({
    totalCars: 0,
    activeBookings: 0,
    totalEarnings: 0,
    thisMonthEarnings: 0,
    recentBookings: [] as any[],
  });
  useEffect(() => {
    loadDashboardData();
  }, []);

const loadDashboardData = async () => {
  try {
    console.log('🔵 Loading vendor dashboard data...');
    const { auth, db } = await import('../config/firebase');
    const { collection, query, where, getDocs, doc, updateDoc } = await import('firebase/firestore');
    const { calculateBookingStatus } = await import('../utils/dateHelpers'); // ✅ IMPORT

    const vendorId = auth.currentUser?.uid;
    if (!vendorId) {
      console.log('❌ No vendor logged in');
      setLoading(false);
      return;
    }

    // 1. Get total cars
    const carsQuery = query(collection(db, 'cars'), where('vendorId', '==', vendorId));
    const carsSnapshot = await getDocs(carsQuery);
    const totalCars = carsSnapshot.size;

    // 2. Get all bookings
    const bookingsQuery = query(collection(db, 'bookings'), where('vendorId', '==', vendorId));
    const bookingsSnapshot = await getDocs(bookingsQuery);

    let activeBookings = 0;
    let totalEarnings = 0;
    let thisMonthEarnings = 0;
    const recentBookingsList: any[] = [];

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // ✅ Process each booking with TIME
    for (const docSnapshot of bookingsSnapshot.docs) {
      const booking = docSnapshot.data();
      const bookingId = docSnapshot.id;

      // Calculate status with TIME
      const actualStatus = calculateBookingStatus(
        booking.startDate,
        booking.startTime,
        booking.endDate,
        booking.stopTime
      );

      // Update Firebase if status changed
      if (actualStatus !== booking.status) {
        console.log(`🔄 Dashboard: Updating ${bookingId} from ${booking.status} to ${actualStatus}`);
        await updateDoc(doc(db, 'bookings', bookingId), {
          status: actualStatus,
        });
        booking.status = actualStatus;
      }

      // Count active bookings (upcoming or ongoing)
      if (booking.status === 'upcoming' || booking.status === 'ongoing') {
        activeBookings++;
      }

      // Calculate earnings from completed bookings
      if (booking.status === 'completed') {
        const amount = booking.totalPrice || 0;
        totalEarnings += amount;

        // Check if booking is from this month
        const { parseDateTime } = await import('../utils/dateHelpers');
        const startDateTime = parseDateTime(booking.startDate, booking.startTime);
        
        if (startDateTime.getMonth() === currentMonth && startDateTime.getFullYear() === currentYear) {
          thisMonthEarnings += amount;
        }
      }

      // Add to recent bookings
      recentBookingsList.push({ id: bookingId, ...booking });
    }

    // Sort recent bookings by creation date
    recentBookingsList.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });

    setDashboardData({
      totalCars,
      activeBookings,
      totalEarnings,
      thisMonthEarnings,
      recentBookings: recentBookingsList.slice(0, 5),
    });

    console.log('✅ Dashboard data loaded:', {
      totalCars,
      activeBookings,
      recentBookings: recentBookingsList.length,
      thisMonthEarnings,
      totalEarnings,
    });
  } catch (error) {
    console.error('❌ Error loading dashboard:', error);
  } finally {
    setLoading(false);
  }
};
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing':
        return '#10B981';
      case 'confirmed':
      case 'upcoming':
        return '#3B82F6';
      case 'completed':
        return '#6B7280';
      default:
        return colors.textSecondary;
    }
  };

  if (loading) {
    console.log(dashboardData.recentBookings[0]);
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 16, color: colors.textSecondary }}>Loading dashboard...</Text>
      </View>
    );
  }

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

        <View style={styles.headerContent}>
  <View>
    <Text style={styles.greeting}>Welcome back,</Text>
    <Text style={styles.vendorName}>{vendorName}</Text>
  </View>
  <View style={styles.headerActions}>
    <TouchableOpacity
      style={styles.notificationButton}
      onPress={onNavigateToNotifications}
    >
      <Image
        source={require('../../assets/images/notificationicon.png')}
        style={styles.notificationIcon}
        resizeMode="contain"
      />
      {hasUnreadNotifications && <View style={styles.notificationBadge} />}
    </TouchableOpacity>
    <TouchableOpacity
      style={styles.profileButton}
      onPress={onNavigateToProfile}
    >
      <Image
        source={require('../../assets/images/profileicon.png')}
        style={styles.profileIcon}
        resizeMode="contain"
      />
    </TouchableOpacity>
  </View>
</View>
</View>

<View style={styles.contentWrapper}>
  <ScrollView
    style={styles.scrollView}
    contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
{/* Stats Cards */}
<View style={styles.statsContainer}>

  {/* Total Cars */}
  <TouchableOpacity
    style={[styles.statCard, styles.statCardPrimary]}
    onPress={onNavigateToFleet}
  >
   <View style={styles.statIconContainer}>
      <Image
        source={require('../../assets/images/caricon.png')}
        style={styles.statIconImage}
        resizeMode="contain"
      />
    </View>
    <Text style={styles.statValue}>{dashboardData.totalCars}</Text> 
    <Text style={styles.statLabel}>Total Cars</Text>
  </TouchableOpacity>

  {/* Active Bookings */}
  <TouchableOpacity
    style={[styles.statCard, styles.statCardSuccess]}
    onPress={onNavigateToBookings}
  >
   <View style={styles.statIconContainer}>
      <Image
        source={require('../../assets/images/calender.png')}
        style={styles.statIconImage}
        resizeMode="contain"
      />
    </View>
    <Text style={styles.statValue}>{dashboardData.activeBookings}</Text>
    <Text style={styles.statLabel}>Active Bookings</Text>
  </TouchableOpacity>
</View>

{/* Earnings Card */}
<TouchableOpacity style={styles.earningsCard} onPress={onNavigateToEarnings}>
  <LinearGradient
    colors={['#10B981', '#059669']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.earningsGradient}
  >
    <View style={styles.earningsContent}>
      <View>
        <Text style={styles.earningsLabel}>Total Earnings</Text>
        <Text style={styles.earningsValue}>
          ₦{dashboardData.totalEarnings.toLocaleString()} {/* ✅ CHANGE */}
        </Text>
        <Text style={styles.earningsSubtext}>
          +₦{dashboardData.thisMonthEarnings.toLocaleString()} this month {/* ✅ CHANGE */}
        </Text>
      </View>
      <View style={styles.earningsIcon}>
        <Image
          source={require('../../assets/images/vendorwalleticon.png')}
          style={styles.earningsIconImage}
          resizeMode="contain"
        />
      </View>
    </View>
  </LinearGradient>
</TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionCard} onPress={onAddCar}>
             <View style={styles.quickActionIcon}>
  <Image
    source={require('../../assets/images/plusicon.png')}
    style={styles.quickActionIconImage}
    resizeMode="contain"
  />
</View>
              <Text style={styles.quickActionText}>Add New Car</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={onNavigateToBookings}
            >
              <View style={styles.quickActionIcon}>
  <Image
    source={require('../../assets/images/bookingsicon.png')}
    style={styles.quickActionIconImage}
    resizeMode="contain"
  />
</View>
              <Text style={styles.quickActionText}>View Bookings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={onNavigateToDrivers}
            >
              <View style={styles.quickActionIcon}>
  <Image
    source={require('../../assets/images/drivericon.png')}
    style={styles.quickActionIconImage}
    resizeMode="contain"
  />
</View>
              <Text style={styles.quickActionText}>Manage Drivers</Text>
            </TouchableOpacity>

            <TouchableOpacity
  style={styles.quickActionCard}
  onPress={onNavigateToWithdrawFunds}  
>
             <View style={styles.quickActionIcon}>
  <Image
    source={require('../../assets/images/withdrawicon.png')}
    style={styles.quickActionIconImage}
    resizeMode="contain"
  />
</View>
              <Text style={styles.quickActionText}>Withdraw Funds</Text>
            </TouchableOpacity>
          </View>
        </View>

{/* Recent Bookings */}
<View style={styles.section}>
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>Recent Bookings</Text>
    <TouchableOpacity onPress={onNavigateToBookings}>
      <Text style={styles.seeAllText}>See All</Text>
    </TouchableOpacity>
  </View>

  {dashboardData.recentBookings && dashboardData.recentBookings.length === 0 ? (
    <View style={styles.emptyBookingsContainer}>
      <Text style={styles.emptyBookingsText}>No recent bookings yet</Text>
    </View>
  ) : (
    <View style={styles.bookingsList}>
      {dashboardData.recentBookings && dashboardData.recentBookings.map((booking: any) => {
        // ✅ Get car image
        const carImage = booking.car?.photos?.[0] || booking.carImage;
        
        return (
          <TouchableOpacity
            key={booking.id}
            style={styles.bookingCard}
            onPress={() => onNavigateToBookingDetails(booking.id)}
          >
            <View style={styles.bookingLeft}>
              {/* ✅ REAL CAR IMAGE */}
              <View style={styles.bookingCarImageContainer}>
                {carImage ? (
                  <Image
                    source={{ uri: carImage }}
                    style={styles.bookingCarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.bookingCarPlaceholder}>
                    <Text style={styles.bookingCarIconText}>🚗</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingCustomer}>
                  {String(booking.customerName || 'Unknown')}
                </Text>
                <Text style={styles.bookingCar}>
                  {String(booking.car?.brand || '')} {String(booking.car?.model || booking.carModel || 'Car')}
                </Text>
                <Text style={styles.bookingDate}>
                  {String(booking.startDate || 'No date')}
                </Text>
              </View>
            </View>
            
            <View style={styles.bookingRight}>
              <Text style={styles.bookingAmount}>
                ₦{(booking.totalPrice || 0).toLocaleString()}
              </Text>
              <View
                style={[
                  styles.bookingStatus,
                  { backgroundColor: getStatusColor(booking.status) + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.bookingStatusText,
                    { color: getStatusColor(booking.status) },
                  ]}
                >
                  {String(booking.status || 'pending')}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  )}
</View>
      <View style={styles.bottomSpacing} />
     </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Image
            source={require('../../assets/images/homeicon.png')}
            style={styles.navIconActive}
            resizeMode="contain"
          />
          <Text style={styles.navLabelActive}>Dashboard</Text>
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

   <TouchableOpacity style={styles.navItem} onPress={onNavigateToEarnings}>
  <Image
                    source={require('../../assets/images/walleticon.png')}
                    style={styles.navIconActive}
                    resizeMode="contain"
                  />
                  <Text style={styles.navLabel}>Earnings</Text>
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: typography.fontSize.base,
    color: colors.textWhite,
    opacity: 0.9,
    top: 30,
  },
  vendorName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    marginTop: spacing.xs,
    top: 30,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationIcon: {
    width: 24,
    height: 24,
    tintColor: colors.textWhite,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    width: 24,
    height: 24,
    tintColor: colors.textWhite,
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
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
  },
  statCardPrimary: {
    backgroundColor: '#DBEAFE',
  },
  statCardSuccess: {
    backgroundColor: '#D1FAE5',
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statIcon: {
    fontSize: 24,
  },
  statValue: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  earningsCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  earningsGradient: {
    padding: spacing.lg,
  },
  earningsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textWhite,
    opacity: 0.9,
    marginBottom: spacing.xs,
  },
  earningsValue: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    marginBottom: spacing.xs,
  },
  earningsSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textWhite,
    opacity: 0.8,
  },
  earningsIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  earningsIconText: {
    fontSize: 30,
  },
  section: {
    marginBottom: spacing.xl,
    top: -0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    top: 15,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    top: -5,
  },
  seeAllText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.semiBold,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickActionCard: {
    width: '47%',
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickActionIconText: {
    fontSize: 24,
  },
  quickActionText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
  bookingsList: {
    gap: spacing.md,
  },
  bookingCard: {
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bookingCarIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  bookingCarIconText: {
    fontSize: 20,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingCustomer: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: 2,
  },
  bookingCar: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  bookingDate: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  bookingRight: {
    alignItems: 'flex-end',
  },
  bookingAmount: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  bookingStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  bookingStatusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    textTransform: 'capitalize',
  },
  bottomSpacing: {
    height: 20,
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
  statIconImage: {
  width: 28,
  height: 18,
  tintColor: colors.primary,
},
earningsIconImage: {
  width: 32,
  height: 18,
  tintColor: colors.textWhite,
},
quickActionIconImage: {
  width: 28,
  height: 18,
  tintColor: colors.primary,
},
emptyBookingsContainer: {
  padding: spacing.xl,
  alignItems: 'center',
  backgroundColor: colors.backgroundGray,
  borderRadius: borderRadius.lg,
  marginTop: spacing.sm,
},
emptyBookingsText: {
  fontSize: typography.fontSize.sm,
  color: colors.textSecondary,
},
bookingCarImageContainer: {
  width: 60,
  height: 60,
  borderRadius: borderRadius.md,
  overflow: 'hidden',
  marginRight: spacing.md,
  backgroundColor: colors.backgroundGray,
},
bookingCarImage: {
  width: '100%',
  height: '100%',
},
bookingCarPlaceholder: {
  width: '100%',
  height: '100%',
  backgroundColor: colors.primary + '20',
  justifyContent: 'center',
  alignItems: 'center',
},
});
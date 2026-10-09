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

interface VendorBookingsScreenProps {
  onNavigateToDashboard: () => void;
  onNavigateToFleet: () => void;
  onNavigateToProfile: () => void;
  onViewBookingDetails: (bookingId: string) => void;
}

export const VendorBookingsScreen: React.FC<VendorBookingsScreenProps> = ({
  onNavigateToDashboard,
  onNavigateToFleet,
  onNavigateToProfile,
  onViewBookingDetails,
}) => {
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'ongoing' | 'completed'>('upcoming');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);


// Fetch vendor bookings from Firebase
useEffect(() => {
  const fetchBookings = async () => {
    try {
      console.log('🔵 Loading vendor bookings...');
      const { auth } = await import('../config/supabase');
      const vendorId = auth.currentUser?.uid;
      if (!vendorId) {
        setLoading(false);
        return;
      }

      // Statuses are kept up to date by the server ('past' is shown as 'completed' here).
      const { getVendorBookings } = await import('../services/bookingService');
      const result = await getVendorBookings(vendorId);
      setBookings(
        (result.bookings ?? []).map((b) => ({ ...b, status: b.status === 'past' ? 'completed' : b.status }))
      );
    } catch (error) {
      console.error('❌ Error loading bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  fetchBookings();
}, [selectedTab]);


  const filteredBookings = bookings.filter((booking) => booking.status === selectedTab);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '#3B82F6';
      case 'ongoing':
        return '#10B981';
      case 'completed':
        return '#6B7280';
      default:
        return colors.textSecondary;
    }
  };

 const getStatusText = (status: string) => {
  if (!status) return 'Unknown'; // ✅ ADD THIS CHECK
  return status.charAt(0).toUpperCase() + status.slice(1);
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

        <Text style={styles.headerTitle}>Bookings</Text>
      </View>

      {/* Content Wrapper */}
      <View style={styles.contentWrapper}>
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'upcoming' && styles.tabActive]}
            onPress={() => setSelectedTab('upcoming')}
          >
            <Text style={[styles.tabText, selectedTab === 'upcoming' && styles.tabTextActive]}>
              Upcoming
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, selectedTab === 'ongoing' && styles.tabActive]}
            onPress={() => setSelectedTab('ongoing')}
          >
            <Text style={[styles.tabText, selectedTab === 'ongoing' && styles.tabTextActive]}>
              Ongoing
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, selectedTab === 'completed' && styles.tabActive]}
            onPress={() => setSelectedTab('completed')}
          >
            <Text style={[styles.tabText, selectedTab === 'completed' && styles.tabTextActive]}>
              Completed
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Loading bookings...</Text>
            </View>
          ) : filteredBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No {selectedTab} bookings</Text>
              <Text style={styles.emptyText}>
                {selectedTab === 'upcoming'
                  ? 'New bookings will appear here'
                  : selectedTab === 'ongoing'
                  ? 'Active bookings will show here'
                  : 'Completed bookings history'}
              </Text>
            </View>
          ) : (
            <View style={styles.bookingsList}>
              {filteredBookings.map((booking) => (
              <TouchableOpacity
  key={booking.id}
  style={styles.bookingCard}
  onPress={() => onViewBookingDetails(booking.id)}
>
  {/* Status Badge */}
  <View
    style={[
      styles.statusBadge,
      { backgroundColor: getStatusColor(booking.status) },
    ]}
  >
    <Text style={styles.statusText}>{getStatusText(booking.status)}</Text>
  </View>

  {/* Car Image and Info Combined */}
  <View style={styles.carSection}>
    <View style={styles.carImageContainer}>
      {booking.car?.photos && booking.car.photos.length > 0 ? (
        <Image 
          source={{ uri: booking.car.photos[0] }} 
          style={styles.carImage} 
          resizeMode="cover"
        />
      ) : (
        <View style={styles.carImagePlaceholder}>
          <Text style={styles.carIconText}>🚗</Text>
        </View>
      )}
    </View>
    <View style={styles.carInfo}>
      <Text style={styles.carName}>
        {booking.car?.brand || booking.carBrand} {booking.car?.model || booking.carModel}
      </Text>
      <Text style={styles.carDetails}>
        {booking.car?.year || booking.carYear} • {booking.duration} {booking.durationType}
        {booking.duration > 1 ? 's' : ''}
      </Text>
      <Text style={styles.carDetails}>
        {booking.rideMode === 'with-driver' ? '👨‍✈️ With Driver' : '🔑 Self Drive'}
      </Text>
    </View>
  </View>

  {/* Customer Info */}
  <View style={styles.customerSection}>
    <View style={styles.customerAvatar}>
      <Text style={styles.customerAvatarText}>
        {booking.customerName ? booking.customerName.charAt(0).toUpperCase() : '?'}
      </Text>
    </View>
    <View style={styles.customerInfo}>
      <Text style={styles.customerName}>{booking.customerName || 'Unknown Customer'}</Text>
      <Text style={styles.customerPhone}>📞 {booking.customerPhone || 'No phone'}</Text>
    </View>
  </View>

  {/* Booking Details */}
  <View style={styles.detailsSection}>
    <View style={styles.detailRow}>
      <View style={styles.detailItem}>
        <Text style={styles.detailLabel}>📅 Start Date</Text>
        <Text style={styles.detailValue}>{booking.startDate}</Text>
        <Text style={styles.detailValueSmall}>{booking.startTime}</Text>
      </View>
      <View style={styles.detailItem}>
        <Text style={styles.detailLabel}>📅 End Date</Text>
        <Text style={styles.detailValue}>{booking.endDate}</Text>
        <Text style={styles.detailValueSmall}>{booking.stopTime}</Text>
      </View>
    </View>
    
    <View style={styles.locationRow}>
      <Text style={styles.detailLabel}>📍 Pickup Location</Text>
      <Text style={styles.detailValue} numberOfLines={2}>{booking.pickupLocation}</Text>
    </View>

    <View style={styles.pickupMethodRow}>
      <Text style={styles.pickupMethod}>
        {booking.pickupMethod === 'vendor' ? '🏢 Customer picks up at your location' : '🚚 Delivery to customer'}
      </Text>
    </View>
  </View>

  {/* Amount */}
  <View style={styles.amountSection}>
    <Text style={styles.amountLabel}>Total Amount</Text>
    <Text style={styles.amount}>
      ₦{booking.totalPrice?.toLocaleString() || '0'}
    </Text>
  </View>
</TouchableOpacity>
              ))}
            </View>
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

        <TouchableOpacity style={styles.navItem}>
          <Image
            source={require('../../assets/images/tripicon.png')}
            style={styles.navIconActive}
            resizeMode="contain"
          />
          <Text style={styles.navLabelActive}>Bookings</Text>
        </TouchableOpacity>

         <TouchableOpacity style={styles.navItem}>
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
  tabsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  tab: {
    flex: 1,
    backgroundColor: colors.inputBackground,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  tabTextActive: {
    color: colors.textWhite,
    fontWeight: typography.fontWeight.semiBold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  bookingsList: {
    gap: spacing.md,
  },
  bookingCard: {
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    position: 'relative',
 
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    color: colors.textWhite,
    fontWeight: typography.fontWeight.semiBold,
  },
  customerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  customerAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  customerAvatarText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  carSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  carIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  carIconText: {
    fontSize: 20,
  },
  carInfo: {
    flex: 1,
  },
  carName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: 2,
  },
  carDetails: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  detailsSection: {
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  amountSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  amountLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  amount: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
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
  carImageContainer: {
  width: 80,
  height: 60,
  borderRadius: borderRadius.md,
  overflow: 'hidden',
  marginRight: spacing.sm,
  backgroundColor: colors.background,
},
carImage: {
  width: '100%',
  height: '100%',
},
carImagePlaceholder: {
  width: '100%',
  height: '100%',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: colors.backgroundGray,
},
detailValueSmall: {
  fontSize: typography.fontSize.xs,
  color: colors.textSecondary,
  marginTop: 2,
},
locationRow: {
  marginTop: spacing.sm,
},
pickupMethodRow: {
  marginTop: spacing.sm,
  backgroundColor: colors.primary + '15',
  padding: spacing.xs,
  borderRadius: borderRadius.sm,
},
pickupMethod: {
  fontSize: typography.fontSize.xs,
  color: colors.primary,
  fontWeight: typography.fontWeight.medium,
},
statusBadge: {
  position: 'absolute',
  top: spacing.md,
  right: spacing.md,
  paddingHorizontal: spacing.sm,
  paddingVertical: 4,
  borderRadius: borderRadius.sm,
  zIndex: 10, // ✅ Add this if not there
},
});
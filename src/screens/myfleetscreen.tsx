import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius } from '../constants';

interface MyFleetScreenProps {
  onNavigateBack: () => void;
  onNavigateToDashboard: () => void;
  onNavigateToBookings: () => void;
  onNavigateToEarnings: () => void;
  onNavigateToProfile: () => void;
  onAddCar: () => void;
  onViewCarDetails: (carId: string) => void;
}

export const MyFleetScreen: React.FC<MyFleetScreenProps> = ({
  onNavigateBack,
  onNavigateToDashboard,
  onNavigateToBookings,
  onNavigateToEarnings,
  onNavigateToProfile,
  onAddCar,
  onViewCarDetails,
}) => {
  // ✅ UPDATED: Added 'pending' filter option
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'booked' | 'pending'>('all');
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const toggleCarAvailability = async (carId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'available' ? 'maintenance' : 'available';
      
      const { updateCarStatus } = await import('../services/carservice');
      const result = await updateCarStatus(carId, newStatus);
      
      if (result.success) {
        // Update local state
        setCars(cars.map(car => 
          car.id === carId ? { ...car, status: newStatus } : car
        ));
        
        Alert.alert(
          'Success',
          `Car marked as ${newStatus === 'available' ? 'available' : 'unavailable'}`
        );
      }
    } catch (error) {
      console.error('Error updating car status:', error);
      Alert.alert('Error', 'Failed to update car status');
    }
  };

  // Fetch vendor's cars from Firebase
  useEffect(() => {
    const fetchCars = async () => {
      try {
        console.log('🔵 Loading vendor cars...');
        const { auth, db } = await import('../config/firebase');
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const { calculateBookingStatus } = await import('../utils/dateHelpers');
        
        const vendorId = auth.currentUser?.uid;

        if (!vendorId) {
          console.log('❌ No vendor logged in');
          setLoading(false);
          return;
        }

        // 1. Get all vendor's cars
        const { getVendorCars } = await import('../services/carservice');
        const result = await getVendorCars(vendorId);

        if (!result.success || !result.cars) {
          setLoading(false);
          return;
        }

        // 2. Get all bookings for this vendor
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('vendorId', '==', vendorId)
        );
        
        const bookingsSnapshot = await getDocs(bookingsQuery);
        
        // Track active bookings (for status) with TIME CHECK
        const activeBookings = new Set<string>();
        
        // Track bookings & earnings per car
        const carStats: { [carId: string]: { bookings: number; earnings: number } } = {};

        bookingsSnapshot.docs.forEach(doc => {
          const booking = doc.data();
          const carId = booking.carId;
          
          // Calculate status with TIME
          const actualStatus = calculateBookingStatus(
            booking.startDate,
            booking.startTime,
            booking.endDate,
            booking.stopTime
          );
          
          // Count for status (upcoming/ongoing only)
          if (actualStatus === 'upcoming' || actualStatus === 'ongoing') {
            activeBookings.add(carId);
          }
          
          // Initialize stats for this car if not exists
          if (!carStats[carId]) {
            carStats[carId] = { bookings: 0, earnings: 0 };
          }
          
          // Count all bookings
          carStats[carId].bookings += 1;
          
          // Count earnings from completed bookings only
          if (actualStatus === 'completed') {
            carStats[carId].earnings += booking.totalPrice || 0;
          }
        });

        // 3. Merge car data with calculated stats
        const carsWithStats = result.cars.map((car: any) => {
          const stats = carStats[car.id] || { bookings: 0, earnings: 0 };
          const isBooked = activeBookings.has(car.id);
          
          return {
            ...car,
            // Only show as booked if car is approved AND has active booking
            status: isBooked && car.approvalStatus === 'approved' ? 'booked' : car.status || 'available',
            totalBookings: stats.bookings,
            totalEarnings: stats.earnings,
            // ✅ Keep approval status
            approvalStatus: car.approvalStatus || 'pending',
            rejectionReason: car.rejectionReason || null,
          };
        });

        console.log(`✅ Loaded ${carsWithStats.length} cars with stats`);
        setCars(carsWithStats);
      } catch (error) {
        console.error('❌ Error loading cars:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, []);

  // ✅ UPDATED: Filter logic includes approval status
  const filteredCars = cars.filter((car) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') return car.approvalStatus === 'pending' || car.approvalStatus === 'rejected';
    if (filterStatus === 'available') return car.approvalStatus === 'approved' && car.status === 'available';
    if (filterStatus === 'booked') return car.approvalStatus === 'approved' && car.status === 'booked';
    return true;
  });

  // ✅ NEW: Get approval status badge
  const getApprovalStatusBadge = (approvalStatus: string) => {
    switch (approvalStatus) {
      case 'approved':
        return null; // Don't show badge for approved cars (show availability instead)
      case 'rejected':
        return (
          <View style={[styles.approvalBadge, styles.approvalBadgeRejected]}>
            <Text style={styles.approvalBadgeText}>✗ Rejected</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.approvalBadge, styles.approvalBadgePending]}>
            <Text style={styles.approvalBadgeText}>⏳ Pending Review</Text>
          </View>
        );
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'available' ? '#10B981' : '#F59E0B';
  };

  const getStatusText = (status: string) => {
    return status === 'available' ? 'Available' : 'Booked';
  };

  // ✅ Count cars by status
  const approvedCars = cars.filter(c => c.approvalStatus === 'approved');
  const pendingOrRejectedCars = cars.filter(c => c.approvalStatus === 'pending' || c.approvalStatus === 'rejected');
  const availableCars = approvedCars.filter(c => c.status === 'available');
  const bookedCars = approvedCars.filter(c => c.status === 'booked');

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
          <Text style={styles.headerTitle}>My Fleet</Text>
          <TouchableOpacity style={styles.addButton} onPress={onAddCar}>
            <Text style={styles.addButtonText}>+ Add Car</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content Wrapper */}
      <View style={styles.contentWrapper}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ✅ UPDATED: Filter Tabs with Pending option */}
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterTab, filterStatus === 'all' && styles.filterTabActive]}
              onPress={() => setFilterStatus('all')}
            >
              <Text style={[styles.filterText, filterStatus === 'all' && styles.filterTextActive]}>
                All ({cars.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterTab, filterStatus === 'pending' && styles.filterTabActive]}
              onPress={() => setFilterStatus('pending')}
            >
              <Text style={[styles.filterText, filterStatus === 'pending' && styles.filterTextActive]}>
                Review ({pendingOrRejectedCars.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterTab, filterStatus === 'available' && styles.filterTabActive]}
              onPress={() => setFilterStatus('available')}
            >
              <Text
                style={[styles.filterText, filterStatus === 'available' && styles.filterTextActive]}
              >
                Live ({availableCars.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterTab, filterStatus === 'booked' && styles.filterTabActive]}
              onPress={() => setFilterStatus('booked')}
            >
              <Text style={[styles.filterText, filterStatus === 'booked' && styles.filterTextActive]}>
                Booked ({bookedCars.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Cars Grid */}
          {loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Loading your fleet...</Text>
            </View>
          ) : filteredCars.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🚗</Text>
              <Text style={styles.emptyTitle}>No cars found</Text>
              <Text style={styles.emptyText}>
                {filterStatus === 'all'
                  ? 'Start adding cars to your fleet'
                  : filterStatus === 'pending'
                  ? 'No cars pending review'
                  : `No ${filterStatus} cars at the moment`}
              </Text>
              {filterStatus === 'all' && (
                <TouchableOpacity style={styles.emptyButton} onPress={onAddCar}>
                  <Text style={styles.emptyButtonText}>Add Your First Car</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.carsGrid}>
              {filteredCars.map((car) => (
                <TouchableOpacity
                  key={car.id}
                  style={[
                    styles.carCard,
                    // ✅ Visual indicator for pending/rejected cars
                    car.approvalStatus === 'pending' && styles.carCardPending,
                    car.approvalStatus === 'rejected' && styles.carCardRejected,
                  ]}
                  onPress={() => onViewCarDetails(car.id)}
                >
                  {/* ✅ Approval Status Badge (for pending/rejected) */}
                  {car.approvalStatus !== 'approved' ? (
                    getApprovalStatusBadge(car.approvalStatus)
                  ) : (
                    // Availability Badge (only for approved cars)
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(car.status) },
                      ]}
                    >
                      <Text style={styles.statusText}>{getStatusText(car.status)}</Text>
                    </View>
                  )}

                  {/* Car Image */}
                  <View style={styles.carImageContainer}>
                    {car.photos && car.photos.length > 0 ? (
                      <Image source={{ uri: car.photos[0] }} style={styles.carImage} resizeMode="contain" />
                    ) : (
                      <Text style={styles.carImagePlaceholder}>🚗</Text>
                    )}
                  </View>

                  {/* Car Info */}
                  <View style={styles.carInfo}>
                    <Text style={styles.carName}>
                      {car.brand} {car.model}
                    </Text>
                    <Text style={styles.carYear}>{car.year}</Text>

                    {/* ✅ Rejection Reason (if rejected) */}
                    {car.approvalStatus === 'rejected' && car.rejectionReason && (
                      <View style={styles.rejectionBox}>
                        <Text style={styles.rejectionTitle}>Reason:</Text>
                        <Text style={styles.rejectionText}>{car.rejectionReason}</Text>
                      </View>
                    )}

                    {/* ✅ Pending Info Box */}
                    {car.approvalStatus === 'pending' && (
                      <View style={styles.pendingInfoBox}>
                        <Text style={styles.pendingInfoText}>
                          Our team is reviewing this car. This usually takes 24-48 hours.
                        </Text>
                      </View>
                    )}

                    {/* Stats (only for approved cars) */}
                    {car.approvalStatus === 'approved' && (
                      <View style={styles.carStats}>
                        <View style={styles.statItem}>
                          <Text style={styles.statLabel}>Bookings</Text>
                          <Text style={styles.statValue}>{car.totalBookings || 0}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                          <Text style={styles.statLabel}>Earnings</Text>
                          <Text style={styles.statValue}>₦{(car.totalEarnings || 0).toLocaleString()}</Text>
                        </View>
                      </View>
                    )}

                    <View style={styles.priceContainer}>
                      <Text style={styles.priceLabel}>Per Day</Text>
                      <Text style={styles.price}>
                        ₦{(car.pricePerDay || 0).toLocaleString()}
                      </Text>
                    </View>

                    {/* Availability Toggle (only for approved cars) */}
                    {car.approvalStatus === 'approved' && (
                      <TouchableOpacity
                        style={[
                          styles.availabilityButton,
                          car.status === 'available' ? styles.availableButton : styles.unavailableButton
                        ]}
                        onPress={() => toggleCarAvailability(car.id, car.status)}
                      >
                        <Text style={styles.availabilityText}>
                          {car.status === 'available' ? '✓ Available' : '✕ Unavailable'}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* ✅ Edit Button for rejected cars */}
                    {car.approvalStatus === 'rejected' && (
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => {
                          Alert.alert(
                            'Edit Car',
                            'Would you like to edit this car and resubmit for review?',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Edit', onPress: () => onViewCarDetails(car.id) },
                            ]
                          );
                        }}
                      >
                        <Text style={styles.editButtonText}>Edit & Resubmit</Text>
                      </TouchableOpacity>
                    )}
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

        <TouchableOpacity style={styles.navItem}>
          <Image
            source={require('../../assets/images/caricon.png')}
            style={styles.navIconActive}
            resizeMode="contain"
          />
          <Text style={styles.navLabelActive}>Fleet</Text>
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
            style={styles.navIcon}
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    top: 30,
  },
  addButton: {
    backgroundColor: colors.textWhite,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  addButtonText: {
    color: colors.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
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
  filterContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  filterTab: {
    flex: 1,
    backgroundColor: colors.inputBackground,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  filterTextActive: {
    color: colors.textWhite,
    fontWeight: typography.fontWeight.semiBold,
  },
  carsGrid: {
    gap: spacing.md,
  },
  carCard: {
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    position: 'relative',
  },
  // ✅ NEW: Card styles for pending/rejected
  carCardPending: {
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
  },
  carCardRejected: {
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    zIndex: 10,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    color: colors.textWhite,
    fontWeight: typography.fontWeight.semiBold,
  },
  // ✅ NEW: Approval badge styles
  approvalBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    zIndex: 10,
  },
  approvalBadgePending: {
    backgroundColor: '#F59E0B',
  },
  approvalBadgeRejected: {
    backgroundColor: '#EF4444',
  },
  approvalBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.textWhite,
    fontWeight: typography.fontWeight.semiBold,
  },
  carImageContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  carImage: {
    width: '100%',
    height: '100%',
  },
  carInfo: {
    gap: spacing.xs,
  },
  carName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  carYear: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  // ✅ NEW: Rejection box styles
  rejectionBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  rejectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: '#991B1B',
    marginBottom: 2,
  },
  rejectionText: {
    fontSize: typography.fontSize.sm,
    color: '#991B1B',
    lineHeight: 18,
  },
  // ✅ NEW: Pending info box styles
  pendingInfoBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  pendingInfoText: {
    fontSize: typography.fontSize.xs,
    color: '#92400E',
    lineHeight: 16,
  },
  carStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  priceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  price: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
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
    marginBottom: spacing.lg,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  emptyButtonText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
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
  carImagePlaceholder: {
    fontSize: 60,
    textAlign: 'center',
  },
  availabilityButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  availableButton: {
    backgroundColor: '#EF4444',
  },
  unavailableButton: {
    backgroundColor: '#10B981',
  },
  availabilityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  // ✅ NEW: Edit button for rejected cars
  editButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
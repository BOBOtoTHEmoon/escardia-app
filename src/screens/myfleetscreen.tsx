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
const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'booked'>('all');
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
      const { calculateBookingStatus } = await import('../utils/dateHelpers'); // ✅ IMPORT
      
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
          status: isBooked ? 'booked' : 'available',
          totalBookings: stats.bookings,
          totalEarnings: stats.earnings,
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

  const filteredCars = cars.filter((car) => {
    if (filterStatus === 'all') return true;
    return car.status === filterStatus;
  });

  const getStatusColor = (status: string) => {
    return status === 'available' ? '#10B981' : '#F59E0B';
  };

  const getStatusText = (status: string) => {
    return status === 'available' ? 'Available' : 'Booked';
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
          {/* Filter Tabs */}
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
              style={[styles.filterTab, filterStatus === 'available' && styles.filterTabActive]}
              onPress={() => setFilterStatus('available')}
            >
              <Text
                style={[styles.filterText, filterStatus === 'available' && styles.filterTextActive]}
              >
                Available ({cars.filter((c) => c.status === 'available').length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterTab, filterStatus === 'booked' && styles.filterTabActive]}
              onPress={() => setFilterStatus('booked')}
            >
              <Text style={[styles.filterText, filterStatus === 'booked' && styles.filterTextActive]}>
                Booked ({cars.filter((c) => c.status === 'booked').length})
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
                  style={styles.carCard}
                  onPress={() => onViewCarDetails(car.id)}
                >
                  {/* Status Badge */}
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(car.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>{getStatusText(car.status)}</Text>
                  </View>

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

                    <View style={styles.priceContainer}>
                      <Text style={styles.priceLabel}>Per Day</Text>
                      <Text style={styles.price}>
  ₦{(car.pricePerDay || 0).toLocaleString()}
</Text>
                    </View>
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
    gap: spacing.sm,
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
    fontSize: typography.fontSize.sm,
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
});
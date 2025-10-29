import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../constants';
import { FilterModal } from '../components/filtermodal';
import { getUserFavorites, addToFavorites, removeFromFavorites } from '../services/favoritesservice';


interface CarsScreenProps {
  onNavigateToCarDetails: (carId: string) => void;
  onNavigateToHome: () => void;
  onNavigateToProfile: () => void;
  onNavigateToTrips: () => void;
}

export const CarsScreen: React.FC<CarsScreenProps> = ({ 
  onNavigateToCarDetails,
  onNavigateToHome,
  onNavigateToProfile,
  onNavigateToTrips,
  
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'popular' | 'deals'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCars();
    loadFavorites();
  }, []);

  const fetchCars = async () => {
    try {
      console.log('🔵 Fetching all cars...');
      const { db } = await import('../config/firebase');
      const { collection, query, where, getDocs } = await import('firebase/firestore');

      const q = query(
        collection(db, 'cars'),
        where('status', '==', 'available')
      );

      const snapshot = await getDocs(q);
      const carsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`✅ Fetched ${carsList.length} cars`);
      setCars(carsList);
    } catch (error) {
      console.error('❌ Error fetching cars:', error);
    } finally {
      setLoading(false);
    }
  };

      const applyFilters = (filters: any) => {
  let filtered = cars;

  // Brand filter
  if (filters.brand !== 'All') {
    filtered = filtered.filter(car => 
      car.brand?.toLowerCase() === filters.brand.toLowerCase()
    );
  }

  // Car type filter
  if (filters.carType !== 'All') {
    filtered = filtered.filter(car => 
      car.type?.toLowerCase() === filters.carType.toLowerCase()
    );
  }

  // Transmission filter
  if (filters.transmission !== 'All') {
    filtered = filtered.filter(car => 
      car.transmission?.toLowerCase() === filters.transmission.toLowerCase()
    );
  }

  // Seats filter
  if (filters.seats !== 'All') {
    if (filters.seats === '6+') {
      filtered = filtered.filter(car => (car.seats || 0) >= 6);
    } else {
      filtered = filtered.filter(car => car.seats === parseInt(filters.seats));
    }
  }

  // Price filter
  filtered = filtered.filter(car => {
    const price = car.pricePerDay || 0;
    return price >= filters.minPrice && price <= filters.maxPrice;
  });

  setCars(filtered);
};

const toggleFavorite = async (carId: string) => {
  const isFav = favorites.includes(carId);
  
  if (isFav) {
    // Remove from favorites
    setFavorites((prev) => prev.filter((id) => id !== carId));
    await removeFromFavorites(carId);
  } else {
    // Add to favorites
    setFavorites((prev) => [...prev, carId]);
    await addToFavorites(carId);
  }
};

  // Filter cars based on selection
 const getFilteredCars = () => {
  let filtered = cars;

  // Apply tab filter
  if (selectedFilter === 'popular') {
    // Sort by rating (highest rated)
    filtered = [...cars].sort((a, b) => {
      const ratingA = a.rating?.averageOverall || 0;
      const ratingB = b.rating?.averageOverall || 0;
      return ratingB - ratingA;
    });
  } else if (selectedFilter === 'deals') {
    // Sort by lowest price
    filtered = [...cars].sort((a, b) => {
      const priceA = a.pricePerDay || 0;
      const priceB = b.pricePerDay || 0;
      return priceA - priceB;
    });
  }

  // Apply search filter
  if (searchQuery) {
    filtered = filtered.filter(
      (car) =>
        car.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        car.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        car.type?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  

  return filtered;
};

const loadFavorites = async () => {
  const result = await getUserFavorites();
  if (result.success) {
    setFavorites(result.favorites);
  }
};

  const filteredCars = getFilteredCars();

  return (
    <View style={styles.container}>
      {/* Header */}
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
        
        <Text style={styles.headerTitle}>Cars</Text>
        
        {/* Filter Button */}
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
          <Image
            source={require('../../assets/images/filtericon.png')}
            style={styles.filterIconImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            style={[styles.filterTab, selectedFilter === 'all' && styles.filterTabActive]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text
              style={[
                styles.filterTabText,
                selectedFilter === 'all' && styles.filterTabTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, selectedFilter === 'popular' && styles.filterTabActive]}
            onPress={() => setSelectedFilter('popular')}
          >
            <Text
              style={[
                styles.filterTabText,
                selectedFilter === 'popular' && styles.filterTabTextActive,
              ]}
            >
              Most popular
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, selectedFilter === 'deals' && styles.filterTabActive]}
            onPress={() => setSelectedFilter('deals')}
          >
            <Text
              style={[
                styles.filterTabText,
                selectedFilter === 'deals' && styles.filterTabTextActive,
              ]}
            >
              Best deals
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Cars Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading cars...</Text>
          </View>
        ) : filteredCars.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🚗</Text>
            <Text style={styles.emptyText}>No cars available</Text>
          </View>
        ) : (
          <View style={styles.carsGrid}>
            {filteredCars.map((car) => (
              <TouchableOpacity
                key={car.id}
                style={styles.carCard}
                onPress={() => onNavigateToCarDetails(car.id)}
              >
                {/* Favorite Icon */}
                <TouchableOpacity
                  style={styles.favoriteIcon}
                  onPress={() => toggleFavorite(car.id)}
                >
                  <Image
                    source={require('../../assets/images/hearticon.png')}
                    style={[
                      styles.logOuticon,
                      favorites.includes(car.id) && styles.heartIconFilled
                    ]}
                    resizeMode="contain"
                  />
                </TouchableOpacity>

                {/* Car Image */}
                <View style={styles.carImageContainer}>
                  {car.photos && car.photos.length > 0 ? (
                    <Image 
                      source={{ uri: car.photos[0] }} 
                      style={styles.carImage} 
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.carImagePlaceholder}>🚗</Text>
                  )}
                </View>

                {/* Rating */}
                <View style={styles.ratingContainer}>
                  <Image
                    source={require('../../assets/images/staricon.png')}
                    style={styles.logOuticon}
                    resizeMode="contain"
                  />
                  <Text style={styles.ratingText}>
                    {car.rating?.averageOverall?.toFixed(1) || '5.0'}
                  </Text>
                </View>

                {/* Car Info */}
                <View style={styles.carInfo}>
                  <Text style={styles.carBrand}>{car.brand}</Text>
                  <Text style={styles.carModel}>{car.model}</Text>
                  <Text style={styles.carLocation}>📍 {car.location}</Text>

                  {/* Features */}
                  <View style={styles.featuresRow}>
                    <View style={styles.featureBadge}>
                      <Text style={styles.featureBadgeText}>{car.seats} seats</Text>
                    </View>
                    <View style={styles.featureBadge}>
                      <Text style={styles.featureBadgeText}>{car.transmission}</Text>
                    </View>
                  </View>

                  <Text style={styles.carPrice}>
                    ₦{car.pricePerDay?.toLocaleString()}/day
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={onNavigateToHome}>
          <Image
            source={require('../../assets/images/homeicon.png')}
            style={styles.navIcon}
            resizeMode="contain"
          />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Image
            source={require('../../assets/images/caricon.png')}
            style={styles.navIconActive}
            resizeMode="contain"
          />
          <Text style={styles.navLabelActive}>Car</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={onNavigateToTrips}>
          <Image
            source={require('../../assets/images/tripicon.png')}
            style={styles.navIcon}
            resizeMode="contain"
          />
          <Text style={styles.navLabel}>Trips</Text>
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

    <FilterModal
  visible={showFilterModal}
  onClose={() => setShowFilterModal(false)}
  onApply={(filters) => {
    console.log('Applying filters:', filters);
    applyFilters(filters);
    setShowFilterModal(false);
  }}
/>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: 80,
    paddingBottom: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    height: 50,
    top: -10,
  },
  filterButton: {
    width: 40,
    height: 40,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    top: -20,
  },
  filterIconImage: {
    width: 20,
    height: 20,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    marginTop: -20,
  },
  filterScroll: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    marginTop: 20,
  },
  filterContent: {
    gap: spacing.sm,
  },
  filterTab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.inputBackground,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  filterTabTextActive: {
    color: colors.textWhite,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  carsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  carCard: {
    width: '47%',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  favoriteIcon: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    zIndex: 10,
  },
  carImageContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.inputBackground,
  },
  carImage: {
    width: '100%',
    height: '70%',
  },
  carImagePlaceholder: {
    fontSize: 50,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  ratingText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginLeft: 2,
    marginRight: spacing.xs,
  },
  carInfo: {
    marginTop: spacing.sm,
  },
  carBrand: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  carModel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  carLocation: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  featureBadge: {
    backgroundColor: colors.inputBackground,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  featureBadgeText: {
    fontSize: 10,
    color: colors.text,
  },
  carPrice: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  bottomSpacing: {
    height: 80,
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
  logOuticon: {
    width: 20,
    height: 20,
  },
  heartIconFilled: {
    tintColor: '#EF4444',
  },
});
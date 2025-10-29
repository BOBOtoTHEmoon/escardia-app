import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../constants';
import { Dimensions } from 'react-native';
import { SearchModal } from '../components/searchmodal';
import { FilterModal } from '../components/filtermodal';
import { LocationSelector } from '../components/locationselector';
import { getUserFavorites, addToFavorites, removeFromFavorites } from '../services/favoritesservice';




const SCREEN_WIDTH = Dimensions.get('window').width;
const brands = ['All', 'Toyota', 'SUV', 'Lexus', 'Honda', 'BMW','Mercedes','Range Rover'];

interface HomeScreenProps {
  userName?: string;
  onNavigateToProfile: () => void;
  onNavigateToCarDetails: (carId: string) => void;
  onNavigateToCars: () => void;
  onNavigateToTrips: () => void;
  onNavigateToSearch: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ 
  userName = 'David', 
  onNavigateToProfile,
  onNavigateToCarDetails,
  onNavigateToCars,
  onNavigateToTrips,
  onNavigateToSearch,
}) => {
  const [userLocation, setUserLocation] = useState('Victoria Island, Lagos');
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [promoIndex, setPromoIndex] = useState(0);
  const [popularCars, setPopularCars] = useState<any[]>([]);
  const [allCars, setAllCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const promoSlides = [
    {
      id: 1,
      discount: '25% off',
      title: 'Weekly deals',
      subtitle: 'Get a New Car Discount\navailable This week only',
    },
    {
      id: 2,
      discount: '30% off',
      title: 'Weekend Special',
      subtitle: 'Luxury cars at amazing\nprices this weekend',
    },
    {
      id: 3,
      discount: '40% off',
      title: 'Monthly Promo',
      subtitle: 'Book for a month and\nsave big on rentals',
    },
  ];

  useEffect(() => {
    fetchCars();
    loadFavorites();
  }, []);

  const fetchCars = async () => {
    console.log('🔵 Loading cars for home screen...');
    const { getAvailableCars } = await import('../services/carservice');
    const result = await getAvailableCars();
    
    if (result.success && result.cars) {
      console.log(`✅ Loaded ${result.cars.length} available cars`);
      setPopularCars(result.cars.slice(0, 10));
      setAllCars(result.cars);
    }
    setLoading(false);
  };

  const applyFilters = (filters: any) => {
    let filtered = allCars;

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

    setPopularCars(filtered.slice(0, 10));
  };

  const filterByBrand = (brand: string) => {
  if (brand === 'All') {
    setPopularCars(allCars.slice(0, 10));
  } else {
    const filtered = allCars.filter(car => 
      car.brand?.toLowerCase() === brand.toLowerCase()
    );
    setPopularCars(filtered.slice(0, 10));
  }
};

const loadFavorites = async () => {
  const result = await getUserFavorites();
  if (result.success) {
    setFavorites(result.favorites);
  }
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

        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.locationContainer}
            onPress={() => setShowLocationSelector(true)}
          >
            <Image
              source={require('../../assets/images/locationicon.png')}
              style={styles.locationIconImage}
              resizeMode="contain"
            />
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>Your Location</Text>
              <View style={styles.locationRow}>
                <Text style={styles.locationText}>{userLocation}</Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.greeting}>Hi {userName},</Text>
        </View>

        <TouchableOpacity style={styles.profilePicture} onPress={onNavigateToProfile}>
          <Image
            source={require('../../assets/images/profileicon.png')}
            style={styles.locationIconImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar with Filter Inside */}
        <View style={styles.searchContainer}>
          <TouchableOpacity style={styles.searchBar} onPress={() => setShowSearchModal(true)}>
            <Image
              source={require('../../assets/images/searchicon.png')}
              style={styles.searchIconImage}
              resizeMode="contain"
            />
            <Text style={styles.searchPlaceholder}>Search for Cars..</Text>
            
            {/* Filter Button Inside Search Bar */}
            <TouchableOpacity 
              style={styles.filterButtonInside}
              onPress={() => setShowFilterModal(true)}
            >
              <Image
                source={require('../../assets/images/filtericon.png')}
                style={styles.filterIconInside}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* Promotional Banner */}
        <View style={styles.promoContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / SCREEN_WIDTH
              );
              setPromoIndex(index);
            }}
            snapToInterval={SCREEN_WIDTH}
            decelerationRate="fast"
          >
            {promoSlides.map((slide) => (
              <View key={slide.id} style={styles.promoSlide}>
                <LinearGradient
                  colors={['#2F5FED', '#1E3A8A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.promoBanner}
                >
                  <Image
                    source={require('../../assets/images/headerpattern.png')}
                    style={styles.promoPattern}
                    resizeMode="cover"
                  />
                  <View style={styles.promoContent}>
                    <Text style={styles.promoDiscount}>{slide.discount}</Text>
                    <Text style={styles.promoTitle}>{slide.title}</Text>
                    <Text style={styles.promoSubtitle}>{slide.subtitle}</Text>
                    <TouchableOpacity style={styles.rentNowButton}>
                      <Text style={styles.rentNowText}>Rent Now</Text>
                      <Text style={styles.rentNowArrow}>→</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.promoImageContainer}>
                    <Image
                      source={require('../../assets/images/promocar.png')}
                      style={styles.promoCarImage}
                      resizeMode="contain"
                    />
                  </View>
                </LinearGradient>
              </View>
            ))}
          </ScrollView>

          {/* Pagination Dots */}
          <View style={styles.promoPagination}>
            {promoSlides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.promoDot,
                  promoIndex === index && styles.promoDotActive,
                ]}
              />
            ))}
          </View>
        </View>
        
        {/* Brands Filter */}
        <View style={styles.brandsSection}>
          <Text style={styles.sectionTitle}>Brands</Text>
          <TouchableOpacity onPress={onNavigateToCars}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.brandsScroll}
          contentContainerStyle={styles.brandsContent}
        >
     {brands.map((brand) => (
  <TouchableOpacity
    key={brand}
    style={[
      styles.brandChip,
      selectedBrand === brand && styles.brandChipActive,
    ]}
    onPress={() => {
      setSelectedBrand(brand);
      filterByBrand(brand);
    }}
  >
              <Text
                style={[
                  styles.brandChipText,
                  selectedBrand === brand && styles.brandChipTextActive,
                ]}
              >
                {brand}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Most Popular Section */}
        <View style={styles.popularSection}>
          <Text style={styles.sectionTitle}>Most Popular</Text>
          <TouchableOpacity onPress={onNavigateToCars}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* Car Grid */}
        <View style={styles.carGrid}>
          {popularCars.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.carCard}
              onPress={() => onNavigateToCarDetails(item.id)}
            >
              <TouchableOpacity
                style={styles.favoriteIcon}
                onPress={() => toggleFavorite(item.id)}
              >
                <Image
                  source={require('../../assets/images/hearticon.png')}
                  style={[
                    styles.heartIconImage,
                    favorites.includes(item.id) && styles.heartIconFilled
                  ]}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              <View style={styles.carImageContainer}>
                {item.photos && item.photos.length > 0 ? (
                  <Image 
                    source={{ uri: item.photos[0] }} 
                    style={styles.carImage} 
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.carImagePlaceholder}>🚗</Text>
                )}
              </View>

              <View style={styles.ratingContainer}>
                <Image
                  source={require('../../assets/images/staricon.png')}
                  style={styles.starIconImage}
                  resizeMode="contain"
                />
                <Text style={styles.ratingText}>
                  {item.rating?.averageOverall?.toFixed(1) || '5.0'}
                </Text>
              </View>

              <View style={styles.carInfo}>
                <Text style={styles.carBrand}>{item.brand}</Text>
                <Text style={styles.carModel}>{item.model}</Text>
                <Text style={styles.carPrice}>
                  ₦{(item.pricePerDay || 0).toLocaleString()}/day
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Image
            source={require('../../assets/images/homeicon.png')}
            style={styles.navIconActive}
            resizeMode="contain"
          />
          <Text style={styles.navLabelActive}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={onNavigateToCars}>
          <Image
            source={require('../../assets/images/caricon.png')}
            style={styles.navIcon}
            resizeMode="contain"
          />
          <Text style={styles.navLabel}>Car</Text>
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

      <SearchModal
        visible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSearch={(query) => console.log('Search:', query)}
        onNavigateToCarDetails={(carId) => {
          onNavigateToCarDetails(carId); 
          setShowSearchModal(false);
        }}
      />

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={(filters) => {
          console.log('Filters:', filters);
          applyFilters(filters);
          setShowFilterModal(false);
        }}
      />

      <LocationSelector
        visible={showLocationSelector}
        currentLocation={userLocation}
        onClose={() => setShowLocationSelector(false)}
        onSelectLocation={(location) => setUserLocation(location)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: 80,
    paddingBottom: 40,
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
  headerLeft: {
    flex: 1,
    zIndex: 1,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textWhite,
    opacity: 0.8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: typography.fontSize.sm,
    color: colors.textWhite,
    fontWeight: typography.fontWeight.medium,
  },
  dropdownIcon: {
    fontSize: 10,
    color: colors.textWhite,
    marginLeft: 4,
  },
  greeting: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    marginBottom: spacing.xs,
    bottom: -5,
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    marginTop: -20,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 50,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.textLight,
  },
  filterButtonInside: {
    width: 40,
    height: 40,
    
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIconInside: {
    width: 20,
    height: 20,
    tintColor: colors.primary,
  },
  promoContainer: {
    marginTop: spacing.lg,
  },
  promoSlide: {
    width: SCREEN_WIDTH,
    paddingHorizontal: spacing.lg,
  },
  promoBanner: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  promoPattern: {
    position: 'absolute',
    width: '90%',
    height: '200%',
    right: -49,
    opacity: 0.7,
  },
  promoContent: {
    flex: 1,
  },
  promoDiscount: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
  },
  promoTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    marginBottom: spacing.xs,
  },
  promoSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textWhite,
    opacity: 0.9,
    marginBottom: spacing.md,
  },
  rentNowButton: {
    backgroundColor: '#FFD700',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  rentNowText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginRight: spacing.xs,
  },
  rentNowArrow: {
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  promoImageContainer: {
    width: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoCarImage: {
    width: 220,
    height: 120,
    left: 26,
  },
  promoPagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  promoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  promoDotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  brandsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  viewAll: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  brandsScroll: {
    paddingHorizontal: spacing.lg,
  },
  brandsContent: {
    gap: spacing.sm,
  },
  brandChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.inputBackground,
  },
  brandChipActive: {
    backgroundColor: colors.primary,
  },
  brandChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  brandChipTextActive: {
    color: colors.textWhite,
  },
  popularSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  carGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  carCard: {
    width: '47%',
    backgroundColor: colors.backgroundGray,
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
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.inputBackground,
  },
  carImage: {
    width: '100%',
    height: '100%',
  },
  carImagePlaceholder: {
    fontSize: 50,
  },
  ratingContainer: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  ratingText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginLeft: 2,
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
  carPrice: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  bottomPadding: {
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
  locationIconImage: {
    width: 20,
    height: 20,
    marginRight: spacing.xs,
  },
  searchIconImage: {
    width: 20,
    height: 20,
    marginRight: spacing.sm,
  },
  heartIconImage: {
    width: 20,
    height: 20,
  },
  heartIconFilled: {
    tintColor: '#FF0000',
  },
  starIconImage: {
    width: 12,
    height: 12,
    marginRight: 2,
  },
});
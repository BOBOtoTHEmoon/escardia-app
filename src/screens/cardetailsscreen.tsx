import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import { Button } from '../components';
import { colors, typography, spacing, borderRadius } from '../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CarDetailsScreenProps {
  carId: string;
  onNavigateBack: () => void;
  onNavigateToTripDetails: (carData: any) => void;
}

export const CarDetailsScreen: React.FC<CarDetailsScreenProps> = ({
  carId,
  onNavigateBack,
  onNavigateToTripDetails,
}) => {
  const [carData, setCarData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
 const [showFullDescription, setShowFullDescription] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // ✅ 1. FETCH CAR DATA
  useEffect(() => {
    const fetchCar = async () => {
      try {
        console.log('🔵 Loading car details for:', carId);
        const { db } = await import('../config/firebase');
        const { doc, getDoc } = await import('firebase/firestore');

        const carDoc = await getDoc(doc(db, 'cars', carId));
        
        if (carDoc.exists()) {
          const car = { id: carDoc.id, ...carDoc.data() };
          console.log('✅ Car loaded:', car);
          setCarData(car);
        } else {
          console.log('❌ Car not found');
          alert('Car not found');
          onNavigateBack();
        }
      } catch (error) {
        console.error('❌ Error loading car:', error);
        alert('Failed to load car details');
        onNavigateBack();
      } finally {
        setLoading(false);
      }
    };

    fetchCar();
  }, [carId]);

  // ✅ 3. LOADING STATE
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading car details...</Text>
      </View>
    );
  }

 
  if (!carData) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Car not found</Text>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backHomeButton}>
          <Text style={styles.backHomeText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 5. FEATURES & DATA 
  const features = [
    { 
      icon: require('../../assets/images/seats.png'), 
      label: `${carData.seats || 4} Seater` 
    },
    { 
      icon: require('../../assets/images/door.png'), 
      label: `${carData.doors || 4} Doors` 
    },
    { 
      icon: require('../../assets/images/ac.png'), 
      label: carData.ac || 'AC' 
    },
    { 
      icon: require('../../assets/images/gear.png'), 
      label: carData.transmission || 'Automatic' 
    },
  ];

  const description = carData.description || 'No description available';
  const photos = carData.photos || [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Car Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Car Image Carousel */}
        <View style={styles.carImageSection}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setCurrentImageIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {photos.length > 0 ? (
              photos.map((photo: string, index: number) => (
                <View key={index} style={styles.carImageContainer}>
                  <Image
                    source={{ uri: photo }}
                    style={styles.carImage}
                    resizeMode="cover"
                  />
                </View>
              ))
            ) : (
              <View style={styles.carImageContainer}>
                <Text style={styles.carImagePlaceholder}>🚗</Text>
              </View>
            )}
          </ScrollView>

          {/* Pagination Dots */}
          {photos.length > 1 && (
            <View style={styles.paginationDots}>
              {photos.map((_: any, index: number) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    currentImageIndex === index && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Car Info */}
        <View style={styles.infoSection}>
          {/* Brand and Model */}
          <View style={styles.brandRow}>
            <View style={styles.brandInfo}>
              <Text style={styles.brandName}>
                {carData.brand} {carData.model}
              </Text>
              <Text style={styles.carYear}>{carData.year}</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingStar}>⭐</Text>
              <Text style={styles.ratingText}>
                {carData.rating?.averageOverall?.toFixed(1) || '5.0'}
              </Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.locationRow}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.location}>{carData.location}</Text>
          </View>

          {/* Description */}
          {description !== 'No description available' && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>About this car</Text>
              <Text
                style={styles.description}
                numberOfLines={showFullDescription ? undefined : 3}
              >
                {description}
              </Text>
              {description.length > 100 && (
                <TouchableOpacity
                  onPress={() => setShowFullDescription(!showFullDescription)}
                >
                  <Text style={styles.seeMore}>
                    {showFullDescription ? 'See less...' : 'See more...'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Features */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Features</Text>
            <View style={styles.featuresGrid}>
              {features.map((feature, index) => (
                <View key={index} style={styles.featureCard}>
                  <Image
  source={feature.icon}
  style={styles.featureIconImage}
  resizeMode="contain"
/>
                  <Text style={styles.featureLabel}>{feature.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Pricing */}
          <View style={styles.pricingSection}>
            <Text style={styles.sectionTitle}>Pricing</Text>
            <View style={styles.pricingCards}>
              <View style={styles.priceCard}>
                <Text style={styles.priceLabel}>Per Day</Text>
                <Text style={styles.priceValue}>
                  ₦{carData.pricePerDay?.toLocaleString()}
                </Text>
              </View>
              <View style={styles.priceCard}>
                <Text style={styles.priceLabel}>Per Hour</Text>
                <Text style={styles.priceValue}>
                  ₦{carData.pricePerHour?.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          {/* Book Button */}
          <Button
            title="Book This Car"
            onPress={() => onNavigateToTripDetails(carData)}
            style={styles.bookButton}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
    marginBottom: spacing.md,
  },
  backHomeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  backHomeText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
  },
  header: {
    paddingTop: 60,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
  },
  backArrow: {
    fontSize: 20,
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
  scrollView: {
    flex: 1,
  },
  carImageSection: {
    backgroundColor: colors.backgroundGray,
    paddingVertical: spacing.md,
  },
  carImageContainer: {
    width: SCREEN_WIDTH,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carImage: {
    width: SCREEN_WIDTH - spacing.xl * 2,
    height: '100%',
    borderRadius: borderRadius.lg,
  },
  carImagePlaceholder: {
    fontSize: 120,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  infoSection: {
    padding: spacing.lg,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  brandInfo: {
    flex: 1,
  },
  brandName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  carYear: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  ratingStar: {
    fontSize: 16,
    marginRight: 4,
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  location: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  descriptionSection: {
    marginBottom: spacing.lg,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.base * 1.5,
  },
  seeMore: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.xs,
  },
  featuresSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  featureIcon: {
    fontSize: 10,
  },
  featureLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  pricingSection: {
    marginBottom: spacing.xl,
  },
  pricingCards: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  priceCard: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  priceValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  bookButton: {
    borderRadius: borderRadius.lg,
  },
  featureIconImage: {
  width: 20,
  height: 20,
  tintColor: colors.primary,
},
});
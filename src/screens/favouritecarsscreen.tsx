import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../constants';
import { getUserFavorites, removeFromFavorites } from '../services/favoritesservice';

interface FavoriteCarsScreenProps {
  onNavigateBack: () => void;
  onNavigateToCarDetails: (carId: string) => void;
}

export const FavoriteCarsScreen: React.FC<FavoriteCarsScreenProps> = ({
  onNavigateBack,
  onNavigateToCarDetails,
}) => {
  const [favoriteCars, setFavoriteCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      // Get favorite car IDs
      const result = await getUserFavorites();
      
      if (result.success && result.favorites.length > 0) {
        // Fetch car details for each favorite
        const { db } = await import('../config/firebase');
        const { doc, getDoc } = await import('firebase/firestore');
        
        const carPromises = result.favorites.map(async (carId: string) => {
          const carDoc = await getDoc(doc(db, 'cars', carId));
          if (carDoc.exists()) {
            return { id: carDoc.id, ...carDoc.data() };
          }
          return null;
        });

        const cars = await Promise.all(carPromises);
        const validCars = cars.filter(car => car !== null);
        
        console.log(`✅ Loaded ${validCars.length} favorite cars`);
        setFavoriteCars(validCars);
      } else {
        setFavoriteCars([]);
      }
    } catch (error) {
      console.error('❌ Error loading favorites:', error);
      setFavoriteCars([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (carId: string) => {
    // Optimistically update UI
    setFavoriteCars(prev => prev.filter(car => car.id !== carId));
    
    // Remove from Firebase
    await removeFromFavorites(carId);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorite cars</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {loading ? (
          /* Loading State */
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading favorites...</Text>
          </View>
        ) : favoriteCars.length === 0 ? (
          /* Empty State */
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💔</Text>
            <Text style={styles.emptyText}>No favorite cars yet</Text>
            <Text style={styles.emptySubtext}>
              Start adding cars to your favorites
            </Text>
          </View>
        ) : (
          /* Favorite Cars List */
          <View style={styles.carsList}>
            {favoriteCars.map((car) => (
              <TouchableOpacity
                key={car.id}
                style={styles.carCard}
                onPress={() => onNavigateToCarDetails(car.id)}
              >
                {/* Heart Icon */}
                <TouchableOpacity
                  style={styles.heartIcon}
                  onPress={() => handleRemoveFavorite(car.id)}
                >
                  <Image
                    source={require('../../assets/images/hearticon.png')}
                    style={styles.heartIconImage}
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

                {/* Car Info */}
                <View style={styles.carInfo}>
                  <Text style={styles.carPrice}>
                    ₦{car.pricePerDay?.toLocaleString()}/day
                  </Text>
                  
                  <Text style={styles.carName}>
                    {car.brand} {car.model}
                  </Text>
                  
                  <View style={styles.locationRow}>
                    <Image
                      source={require('../../assets/images/locationicon.png')}
                      style={styles.locationIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.locationText}>{car.location}</Text>
                  </View>

                  {/* Rating */}
                  <View style={styles.ratingRow}>
                    <Image
                      source={require('../../assets/images/staricon.png')}
                      style={styles.starIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.ratingText}>
                      {car.rating?.averageOverall?.toFixed(1) || '5.0'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  header: {
    paddingTop: 60,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  carsList: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  carCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
  },
  heartIcon: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartIconImage: {
    width: 24,
    height: 24,
    tintColor: '#EF4444',
  },
  carImageContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  carImage: {
    width: '100%',
    height: '100%',
  },
  carImagePlaceholder: {
    fontSize: 50,
  },
  carInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  carPrice: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  carName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  locationIcon: {
    width: 14,
    height: 14,
  },
  locationText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  starIcon: {
    width: 14,
    height: 14,
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
  },
  bottomSpacing: {
    height: 20,
  },
});
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
import { colors, typography, spacing, borderRadius } from '../constants';

interface VendorCarDetailScreenProps {
  onNavigateBack: () => void;
  carId: string;
  onEditCar: (carId: string) => void;
  onDeleteCar: (carId: string) => void;
}

export const VendorCarDetailScreen: React.FC<VendorCarDetailScreenProps> = ({
  onNavigateBack,
  carId,
  onEditCar,
  onDeleteCar,
}) => {
  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  useEffect(() => {
    const fetchCarDetails = async () => {
      try {
        console.log('🔵 Loading car details:', carId);
        const { db } = await import('../config/firebase');
        const { doc, getDoc } = await import('firebase/firestore');

        const carDoc = await getDoc(doc(db, 'cars', carId));
        
        if (carDoc.exists()) {
          setCar({ id: carDoc.id, ...carDoc.data() });
          console.log('✅ Car loaded');
        }
      } catch (error) {
        console.error('❌ Error loading car:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCarDetails();
  }, [carId]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Car',
      'Are you sure you want to remove this car from your fleet? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDeleteCar(carId),
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    return status === 'available' ? '#10B981' : '#F59E0B';
  };

  const getStatusText = (status: string) => {
    return status === 'available' ? 'Available' : 'Booked';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Car Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!car) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Car Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Car not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Car Details</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(car.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusText(car.status)}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Car Images */}
        <View style={styles.imageSection}>
          {car.photos && car.photos.length > 0 ? (
            <>
              <Image
                source={{ uri: car.photos[activePhotoIndex] }}
                style={styles.mainImage}
                resizeMode="cover"
              />
              {car.photos.length > 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.thumbnailScroll}
                  contentContainerStyle={styles.thumbnailContainer}
                >
                  {car.photos.map((photo: string, index: number) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setActivePhotoIndex(index)}
                      style={[
                        styles.thumbnail,
                        activePhotoIndex === index && styles.thumbnailActive,
                      ]}
                    >
                      <Image
                        source={{ uri: photo }}
                        style={styles.thumbnailImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderText}>🚗</Text>
              <Text style={styles.placeholderSubtext}>No photos</Text>
            </View>
          )}
        </View>

        {/* Car Info */}
        <View style={styles.section}>
          <Text style={styles.carName}>
            {car.brand} {car.model}
          </Text>
          <Text style={styles.carYear}>Year: {car.year}</Text>
          <View style={styles.typeChip}>
            <Text style={styles.typeText}>{car.type?.toUpperCase()}</Text>
          </View>
        </View>

        {/* Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Pricing</Text>
          <View style={styles.pricingCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Per Day</Text>
              <Text style={styles.priceValue}>₦{car.pricePerDay?.toLocaleString()}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Per Hour</Text>
              <Text style={styles.priceValue}>₦{car.pricePerHour?.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Specifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 Specifications</Text>
          <View style={styles.specsCard}>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Seats</Text>
              <Text style={styles.specValue}>{car.seats} Seats</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Doors</Text>
              <Text style={styles.specValue}>{car.doors} Doors</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Transmission</Text>
              <Text style={styles.specValue}>
                {car.transmission?.charAt(0).toUpperCase() + car.transmission?.slice(1)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Fuel Type</Text>
              <Text style={styles.specValue}>
                {car.fuelType?.charAt(0).toUpperCase() + car.fuelType?.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Pickup Location</Text>
          <View style={styles.locationCard}>
            <Text style={styles.locationText}>{car.location}</Text>
          </View>
        </View>

        {/* Description */}
        {car.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Description</Text>
            <View style={styles.descriptionCard}>
              <Text style={styles.descriptionText}>{car.description}</Text>
            </View>
          </View>
        )}

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Statistics</Text>
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{car.totalBookings || 0}</Text>
              <Text style={styles.statLabel}>Total Bookings</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>₦{(car.totalEarnings || 0).toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Earnings</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => onEditCar(carId)}
          >
            <Text style={styles.editButtonText}>✏️ Edit Car Details</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>🗑️ Delete Car</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
    backgroundColor: colors.background,
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
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
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
  },
  errorText: {
    fontSize: typography.fontSize.base,
    color: '#EF4444',
  },
  imageSection: {
    backgroundColor: colors.backgroundGray,
  },
  mainImage: {
    width: '100%',
    height: 200,
  },
  imagePlaceholder: {
    width: '100%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
  },
  placeholderText: {
    fontSize: 100,
    marginBottom: spacing.sm,
  },
  placeholderSubtext: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  thumbnailScroll: {
    backgroundColor: colors.backgroundGray,
  },
  thumbnailContainer: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  thumbnail: {
    width: 80,
    height: 60,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: colors.primary,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  section: {
    padding: spacing.lg,
  },
  carName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  carYear: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  typeChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
  },
  typeText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.semiBold,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  pricingCard: {
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  priceLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  priceValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  specsCard: {
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  specLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  specValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
  },
  locationCard: {
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  locationText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    lineHeight: typography.fontSize.base * 1.5,
  },
  descriptionCard: {
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  descriptionText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    lineHeight: typography.fontSize.base * 1.5,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  editButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  editButtonText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
  },
  bottomSpacing: {
    height: 40,
  },
});
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
import { getBookingsByStatus } from '../services/bookingService';
import { auth } from '../config/supabase';
import RatingModal from '../components/ratingmodal';
import ratingService from '../services/ratingservice';

interface TripsScreenProps {
  onNavigateToHome: () => void;
  onNavigateToCars: () => void;
  onNavigateToProfile: () => void;
  onNavigateToTripDetail: (tripData: any) => void; 
}

export const TripsScreen: React.FC<TripsScreenProps> = ({
  onNavigateToHome,
  onNavigateToCars,
  onNavigateToProfile,
  onNavigateToTripDetail, 
}) => {

  const [selectedTab, setSelectedTab] = useState<'ongoing' | 'upcoming' | 'past'>('ongoing');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedTripForRating, setSelectedTripForRating] = useState<any>(null);

  // Fetch trips when tab changes
useEffect(() => {
  const fetchTrips = async () => {
    try {
      const { getUserBookings } = await import('../services/bookingService');
      const userId = auth.currentUser?.uid;
      if (!userId) {
        setLoading(false);
        return;
      }
      // Statuses are kept up to date by the server.
      const result = await getUserBookings(userId);
      setTrips(result.bookings);
    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchTrips();
}, [selectedTab]); 


 const filteredTrips = trips.filter(trip => {
  if (selectedTab === 'ongoing') {
    return trip.status === 'ongoing';
  } else if (selectedTab === 'upcoming') {
    return trip.status === 'upcoming';
  } else {
    // past = completed, under review or cancelled
    return ['past', 'completed', 'disputed', 'cancelled'].includes(trip.status);
  }
});

  const toggleFavorite = (tripId: string) => {
    setFavorites((prev) =>
      prev.includes(tripId) ? prev.filter((id) => id !== tripId) : [...prev, tripId]
    );
  };

  const handleTripPress = (booking: any) => {
    onNavigateToTripDetail(booking);
  };

 const handleRateTrip = (trip: any) => {
  console.log('🔍 Rating trip:', trip.id);
  console.log('🔍 Trip data:', trip);
  setSelectedTripForRating(trip);
  setRatingModalVisible(true);
  console.log('🔍 Modal should be visible now');
};
  const handleSubmitRating = async (ratingData: any) => {
    const user = auth.currentUser;
    
    if (!user || !selectedTripForRating) return;

    try {
      await ratingService.submitRating(
        selectedTripForRating.id,
        selectedTripForRating.car.id || selectedTripForRating.carId,
        user.uid,
        user.displayName || 'Anonymous',
        ratingData
      );

      alert('Thank you for your rating! ⭐');
      setRatingModalVisible(false);
      setSelectedTripForRating(null);

      // Refresh trips to update the rated status
      const result = await getBookingsByStatus(user.uid, selectedTab);
      if (result.success && result.bookings) {
        setTrips(result.bookings);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating. Please try again.');
    }
  };

  const handleCloseRatingModal = () => {
    setRatingModalVisible(false);
    setSelectedTripForRating(null);
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
        
        <Text style={styles.headerTitle}>Trips</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'ongoing' && styles.tabActive]}
          onPress={() => setSelectedTab('ongoing')}
        >
          <Text style={[styles.tabText, selectedTab === 'ongoing' && styles.tabTextActive]}>
            Ongoing
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'upcoming' && styles.tabActive]}
          onPress={() => setSelectedTab('upcoming')}
        >
          <Text style={[styles.tabText, selectedTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'past' && styles.tabActive]}
          onPress={() => setSelectedTab('past')}
        >
          <Text style={[styles.tabText, selectedTab === 'past' && styles.tabTextActive]}>
            Past
          </Text>
        </TouchableOpacity>
      </View>

     <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
  {loading ? (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>Loading...</Text>
    </View>
  ) : filteredTrips.length === 0 ? (
    <View style={styles.emptyState}>
      <Image
        source={require('../../assets/images/notrip.png')}
        style={styles.notripImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyText}>
        There are no {selectedTab} trips
      </Text>
    </View>
  ) : (
    <View style={styles.tripsList}>
      {filteredTrips.map((trip) => {
        console.log('🚗 Trip car data:', trip.car);
        console.log('🚗 Trip car photos:', trip.car?.photos);
        
        return (
          <View key={trip.id}>
            <TouchableOpacity 
              style={styles.tripCard}
              onPress={() => handleTripPress(trip)}
            >
              <TouchableOpacity
                style={styles.favoriteIcon}
                onPress={() => toggleFavorite(trip.id)}
              >
                <Image
                  source={require('../../assets/images/hearticon.png')}
                  style={[
                    styles.heartIconImage,
                    favorites.includes(trip.id) && styles.heartIconFilled
                  ]}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              <View style={styles.carImageContainer}>
                {trip.car?.photos && trip.car.photos.length > 0 ? (
                  <Image 
                    source={{ uri: trip.car.photos[0] }} 
                    style={styles.carImage} 
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.carImagePlaceholder}>🚗</Text>
                )}
              </View>

              <View style={styles.ratingRow}>
                <View style={styles.ratingBadge}>
                  <Image
                    source={require('../../assets/images/staricon.png')}
                    style={styles.starIconImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.ratingText}>4.8</Text>
                </View>
                <View style={styles.durationBadge}>
                  <Image
                    source={require('../../assets/images/clock.png')}
                    style={styles.starIconImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.durationText}>
                    {(() => {
                      if (trip.duration && trip.duration > 0) {
                        return `${trip.duration} ${trip.durationType || 'day'}${trip.duration > 1 ? 's' : ''}`;
                      }
                      const calculateDuration = (startDate: string, endDate: string) => {
                        const parts1 = startDate.split(' ');
                        const parts2 = endDate.split(' ');
                        const months: { [key: string]: number } = {
                          'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                          'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
                        };
                        const start = new Date(parseInt(parts1[2]), months[parts1[1]], parseInt(parts1[0]));
                        const end = new Date(parseInt(parts2[2]), months[parts2[1]], parseInt(parts2[0]));
                        const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                        return Math.max(1, diffDays);
                      };
                      const days = calculateDuration(trip.startDate, trip.endDate);
                      return `${days} day${days > 1 ? 's' : ''}`;
                    })()}
                  </Text>
                </View>
              </View>

              <Text style={styles.carName}>
                {trip.car.brand} {trip.car.model}
              </Text>

              <View style={styles.locationRow}>
                <Image
                  source={require('../../assets/images/location.png')}
                  style={styles.starIconImage}
                  resizeMode="contain"
                />
                <Text style={styles.locationText}>{trip.pickupLocation}</Text>
              </View>

              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>📅</Text>
                  <Text style={styles.detailText}>{trip.startDate}</Text>
                </View>
                {((Array.isArray(trip.escort) && trip.escort.length > 0) || trip.escort?.count > 0) && (
                  <View style={styles.detailItem}>
                    <Image
                      source={require('../../assets/images/guard.png')}
                      style={styles.starIconImage}
                      resizeMode="contain"
                    />
                    <Text style={styles.detailText}>
                      {Array.isArray(trip.escort) 
                        ? trip.escort.reduce((sum: number, e: any) => sum + e.count, 0)
                        : trip.escort?.count || 0}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.price}>NGN {trip.totalPrice.toLocaleString()}</Text>
            </TouchableOpacity>

            {/* Rate Trip Button - Only show for past trips that haven't been rated */}
            {selectedTab === 'past' && trip.status === 'past' && !trip.rated && (
              <TouchableOpacity 
                style={styles.rateButton}
                onPress={() => handleRateTrip(trip)}
              >
                <Text style={styles.rateButtonText}>⭐ Rate Your Trip</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
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

        <TouchableOpacity style={styles.navItem} onPress={onNavigateToCars}>
          <Image
            source={require('../../assets/images/caricon.png')}
            style={styles.navIcon}
            resizeMode="contain"
          />
          <Text style={styles.navLabel}>Car</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}> 
          <Image
            source={require('../../assets/images/tripicon.png')}
            style={styles.navIconActive}
            resizeMode="contain"
          />
          <Text style={styles.navLabelActive}>Trips</Text>
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

      {/* Rating Modal */}
      {selectedTripForRating && (
        <RatingModal
          visible={ratingModalVisible}
          onClose={handleCloseRatingModal}
          onSubmit={handleSubmitRating}
          tripData={{
            carName: `${selectedTripForRating.car.brand} ${selectedTripForRating.car.model}`,
            hadDriver: selectedTripForRating.rideMode === 'Driver',
          }}
        />
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
    top: -10
  },

  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    marginTop: -20,
  },

  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
  },

  tabActive: {
    backgroundColor: colors.primary,
  },

  tabText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },

  tabTextActive: {
    color: colors.textWhite,
    fontWeight: typography.fontWeight.semiBold,
  },

  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },

  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  tripsList: {
    padding: spacing.lg,
    gap: spacing.md,
  },

  tripCard: {
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },

  favoriteIcon: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    zIndex: 10,
  },

  carImageContainer: {
  height: 120,
  width: '100%',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: spacing.md,
  borderRadius: borderRadius.md,
  overflow: 'hidden',
  backgroundColor: colors.inputBackground,
},

  carImagePlaceholder: {
    fontSize: 80,
  },

  ratingRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },

  ratingText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
  },

  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },

  durationText: {
    fontSize: typography.fontSize.xs,
    color: colors.text,
  },

  carName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },

  locationText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  detailsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },

  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  detailIcon: {
    fontSize: 14,
  },

  detailText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },

  price: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },

  rateButton: {
    backgroundColor: '#FFD700',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
    marginHorizontal: spacing.lg,
  },

  rateButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: '#000000',
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
  },

  notripImage: {
    width: 100,
    height: 70,
  },
  carImage: {
  width: '80%',
  height: '100%',
  borderRadius: borderRadius.md,
},
});
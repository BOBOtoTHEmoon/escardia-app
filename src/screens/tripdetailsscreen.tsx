import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Linking } from 'react-native';
import { cancelBooking } from '../services/bookingService';
import { Alert } from 'react-native';

interface TripDetailScreenProps {
  tripData: {
    id: string; // Firebase document ID
    status: 'upcoming' | 'ongoing' | 'past';
    rideMode: 'Driver' | 'Self-Drive';
    durationType: 'hour' | 'day';
    durationValue: number; // 3 hours, 12 hours, 3 days, etc.
    pickupLocation: string;
   car: {
  model: string;
  year: string;
  price: string;
  image?: any; 
  photos?: string[]; 
  seats: number;
  doors: number;
  ac: string;
  transmission: string;
};
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    escortCount: number;
      escort?: any; 
    paymentMethod: string;
    totalCost: string;
    driver?: {
      name: string;
      phone: string;
      photo: any;
    };
    vendor?: {
      name: string;
      phone: string;
      photo: any;
    };
  };
  onNavigateBack: () => void;
  onEditTrip?: () => void;
}

export const TripDetailScreen: React.FC<TripDetailScreenProps> = ({
  tripData,
  onNavigateBack,
  onEditTrip,
}) => {
   console.log('🚗 TripDetailScreen - Full tripData:', tripData);
  console.log('🚗 TripDetailScreen - car object:', tripData.car);
  console.log('🚗 TripDetailScreen - car.photos:', tripData.car?.photos);
  const {
    id,
    status,
    rideMode,
    durationType,
    durationValue,
    pickupLocation,
    car,
    startDate,
    startTime,
    endDate,
    endTime,
    escortCount,
    paymentMethod,
    totalCost,
    driver,
    vendor,
  } = tripData;
  const calculateRealStatus = () => {
  const parseDate = (dateStr: string) => {
    const parts = dateStr.trim().split(' ');
    if (parts.length === 3) {
      const months: { [key: string]: number } = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      const day = parseInt(parts[0]);
      const month = months[parts[1]];
      const year = parseInt(parts[2]);
      return new Date(year, month, day);
    }
    return new Date();
  };

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const tripStart = parseDate(startDate);
  tripStart.setHours(0, 0, 0, 0);
  
  const tripEnd = parseDate(endDate);
  tripEnd.setHours(0, 0, 0, 0);

  if (now >= tripStart && now <= tripEnd) {
    return 'ongoing';
  } else if (now > tripEnd) {
    return 'past';
  }
  return 'upcoming';
};

const realStatus = calculateRealStatus();

  // Format status display
  const getStatusDisplay = () => {
    if (status === 'ongoing') {
      return durationType === 'hour' ? `${durationValue} hours` : `Day ${durationValue}`;
    }
    if (status === 'upcoming') {
      return durationType === 'hour' ? `${durationValue} hours` : `${durationValue} Days`;
    }
    // Past trips show the end date
    return endDate;
  };

  // Format trip duration display
  const getTripDuration = () => {
    if (durationType === 'hour') {
      return `${durationValue} hours`;
    }
    return `${durationValue} days`;
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleMessage = (phone: string) => {
    Linking.openURL(`sms:${phone}`);
  };
  const handleCancelTrip = () => {
  Alert.alert(
    '❌ Cancel Trip',
    'Are you sure you want to cancel this trip?\n\n📋 Cancellation Policy:\n\n• 24+ hours before: 100% refund\n• 12-24 hours before: 50% refund\n• 2-12 hours before: 25% refund\n• Less than 2 hours: No refund',
    [
      {
        text: 'No, Keep Trip',
        style: 'cancel',
      },
      {
        text: 'Yes, Cancel Trip',
        style: 'destructive',
        onPress: async () => {
          const result = await cancelBooking(id);
          
          if (result.success) {
            Alert.alert(
              '✅ Trip Cancelled',
              `Your trip has been cancelled successfully.\n\nRefund: ${result.refundPercentage}% of total cost will be processed within 3-5 business days.`,
              [
                {
                  text: 'OK',
                  onPress: () => onNavigateBack(),
                }
              ]
            );
          } else {
            Alert.alert('Error', result.error || 'Failed to cancel trip');
          }
        },
      },
    ]
  );
};

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Details</Text>
        {realStatus === 'upcoming' && onEditTrip ? (
          <TouchableOpacity onPress={onEditTrip}>
            <Text style={styles.editButton}>Edit Trip</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      <ScrollView style={styles.content}>
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, styles[`${realStatus}Badge`]]}>
           <Text style={styles.statusText}>
  {realStatus.charAt(0).toUpperCase() + realStatus.slice(1)}
</Text>
          </View>
          <Text style={styles.durationText}>{getStatusDisplay()}</Text>
        </View>

        {/* Map Placeholder */}
        <View style={styles.mapContainer}>
          <Image
            source={require('../../assets/images/map.png')}
            style={styles.mapImage}
            resizeMode="cover"
          />
        </View>

        {/* Pick-up Location */}
        <View style={styles.locationSection}>
          <Text style={styles.sectionLabel}>Pick-up Location</Text>
          <View style={styles.locationRow}>
            <Image
              source={require('../../assets/images/location.png')}
              style={styles.locationIcon}
              resizeMode="contain"
            />
            <Text style={styles.locationText}>{pickupLocation}</Text>
          </View>
        </View>

        {/* Car Details */}
        <View style={styles.carSection}>
          <Text style={styles.sectionLabel}>Car details</Text>
          <View style={styles.carCard}>
            <View style={styles.carHeader}>
              <View>
                <Text style={styles.carModel}>{car.model}</Text>
                <Text style={styles.carYear}>{car.year}</Text>
              </View>
              <Text style={styles.carPrice}>NGN {car.price}</Text>
            </View>

           {car.photos && car.photos.length > 0 ? (
  <Image 
    source={{ uri: car.photos[0] }} 
    style={styles.carImage} 
    resizeMode="cover"
  />
) : (
  <View style={styles.carImagePlaceholder}>
    <Text style={styles.carImageEmoji}>🚗</Text>
  </View>
)}

            <View style={styles.carSpecs}>
              <View style={styles.specItem}>
                <Image
                  source={require('../../assets/images/seats.png')}
                  style={styles.specIcon}
                  resizeMode="contain"
                />
                <Text style={styles.specText}>{car.seats} seats</Text>
              </View>
              <View style={styles.specItem}>
                <Image
                  source={require('../../assets/images/door.png')}
                  style={styles.specIcon}
                  resizeMode="contain"
                />
                <Text style={styles.specText}>{car.doors} doors</Text>
              </View>
              <View style={styles.specItem}>
                <Image
                  source={require('../../assets/images/ac.png')}
                  style={styles.specIcon}
                  resizeMode="contain"
                />
                <Text style={styles.specText}>{car.ac} AC</Text>
              </View>
              <View style={styles.specItem}>
                <Image
                  source={require('../../assets/images/gear.png')}
                  style={styles.specIcon}
                  resizeMode="contain"
                />
                <Text style={styles.specText}>{car.transmission}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Trip Details */}
        <View style={styles.tripDetailsSection}>
          <View style={styles.tripDetailsHeader}>
            <Text style={styles.sectionLabel}>Trip details</Text>
            <TouchableOpacity>
              <Text style={styles.paymentLink}>Payment details</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Trip Duration</Text>
              <Text style={styles.detailValue}>{getTripDuration()}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Start Day/Time</Text>
              <Text style={styles.detailValue}>{startDate} {startTime}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>End Day/Time</Text>
              <Text style={styles.detailValue}>{endDate} {endTime}</Text>
            </View>

            <View style={styles.detailRow}>
  <Text style={styles.detailLabel}>Escort option</Text>
  <View style={styles.escortValue}>
    <Image
      source={require('../../assets/images/guard.png')}
      style={styles.guardIcon}
      resizeMode="contain"
    />
    <Text style={styles.detailValue}>
      {Array.isArray(tripData.escort) 
        ? tripData.escort.reduce((sum: number, e: any) => sum + e.count, 0)
        : escortCount}
    </Text>
  </View>
</View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ride mode</Text>
              <Text style={styles.detailValue}>{rideMode}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Trip ID</Text>
              <Text style={styles.tripId}>{id}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment method</Text>
              <Text style={styles.detailValue}>{paymentMethod}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total cost</Text>
              <Text style={styles.detailValue}>{totalCost}</Text>
            </View>
          </View>
        </View>
        {realStatus === 'upcoming' && (
  <View style={styles.cancelButtonSection}>
    <TouchableOpacity 
      style={styles.cancelButton}
      onPress={handleCancelTrip}
    >
      <Text style={styles.cancelButtonText}>Cancel Trip</Text>
    </TouchableOpacity>
    <Text style={styles.cancelPolicyText}>
      📋 Cancel 24+ hours before for full refund
    </Text>
  </View>
)}

        {/* Driver/Vendor Details */}
        <View style={styles.contactsSection}>
          <Text style={styles.sectionLabel}>
            {rideMode === 'Driver' ? 'Driver details' : 'Vendor details'}
          </Text>

          {driver && rideMode === 'Driver' && (
            <View style={styles.contactCard}>
              <Image source={driver.photo} style={styles.contactPhoto} />
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{driver.name}</Text>
                <Text style={styles.contactPhone}>{driver.phone}</Text>
              </View>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => handleMessage(driver.phone)}
              >
                <Image
                  source={require('../../assets/images/message.png')}
                  style={styles.contactIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => handleCall(driver.phone)}
              >
                <Image
                  source={require('../../assets/images/phone.png')}
                  style={styles.contactIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          )}

          {vendor && (
            <View style={styles.contactCard}>
              <Image source={vendor.photo} style={styles.contactPhoto} />
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{vendor.name}</Text>
                <Text style={styles.contactPhone}>{vendor.phone}</Text>
              </View>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => handleMessage(vendor.phone)}
              >
                <Image
                  source={require('../../assets/images/message.png')}
                  style={styles.contactIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => handleCall(vendor.phone)}
              >
                <Image
                  source={require('../../assets/images/phone.png')}
                  style={styles.contactIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8EAF6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#E8EAF6',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#000',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  editButton: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  upcomingBadge: {
    backgroundColor: '#DBEAFE',
  },
  ongoingBadge: {
    backgroundColor: '#D1FAE5',
  },
  pastBadge: {
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  mapContainer: {
    height: 180,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  locationSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  carSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  carCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  carHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  carModel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  carYear: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  carPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  carImage: {
  width: '90%',
  height: 130,
  marginVertical: 12,
  borderRadius: 8,
},
  carSpecs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  specText: {
    fontSize: 12,
    color: '#6B7280',
  },
  tripDetailsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tripDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentLink: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '500',
  },
  detailsGrid: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 13,
    color: '#000',
    fontWeight: '500',
  },
  escortValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guardIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  tripId: {
    fontSize: 11,
    color: '#000',
    fontWeight: '500',
  },
  contactsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  contactPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 12,
    color: '#6B7280',
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  contactIcon: {
    width: 18,
    height: 18,
    tintColor: '#FFFFFF',
  },
  cancelButtonSection: {
  paddingHorizontal: 20,
  marginBottom: 20,
},
cancelButton: {
  backgroundColor: '#EF4444',
  borderRadius: 12,
  paddingVertical: 16,
  alignItems: 'center',
  marginBottom: 8,
},
cancelButtonText: {
  fontSize: 16,
  fontWeight: '600',
  color: '#FFFFFF',
},
cancelPolicyText: {
  fontSize: 12,
  color: '#6B7280',
  textAlign: 'center',
},
carImagePlaceholder: {
  width: '100%',
  height: 100,
  backgroundColor: '#F3F4F6',
  justifyContent: 'center',
  alignItems: 'center',
  marginVertical: 12,
  borderRadius: 8,
},
carImageEmoji: {
  fontSize: 60,
},
});
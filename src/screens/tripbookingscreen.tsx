import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, typography, spacing, borderRadius } from '../constants';

interface TripBookingScreenProps {
  carData: {
    id: string;
    brand: string;
    model: string;
    year: string;
    pricePerDay: number;
    pricePerHour: number;
    photos?: string[];
    seats?: number;
    doors?: number;
    transmission?: string;
    location?: string;
    [key: string]: any;
  };
  onNavigateBack: () => void;
  onContinue: (tripData: TripData) => void;
}

interface TripData {
  car: any;
  pickupLocation: string;
  deliveryAddress?: string;
  pickupMethod: 'vendor' | 'delivery';
  rideMode: 'self-drive' | 'with-driver';
  startDate: string;
  endDate: string;
  startTime: string;
  stopTime: string;
  duration: number;
  durationType: 'day' | 'hour';
}

export const TripBookingScreen: React.FC<TripBookingScreenProps> = ({
  carData,
  onNavigateBack,
  onContinue,
}) => {
  const [pickupMethod, setPickupMethod] = useState<'vendor' | 'delivery'>('vendor');
  const [rideMode, setRideMode] = useState<'self-drive' | 'with-driver'>('self-drive');
  const [rateType, setRateType] = useState<'day' | 'hour'>('day');
  const [vendorLocation] = useState('20, Dolphin estate, Victoria Island, Lagos');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  
  // Date and Time states
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [stopTime, setStopTime] = useState(new Date());
  
  // Date picker visibility
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showStopTimePicker, setShowStopTimePicker] = useState(false);

  // ✅ SINGLE formatDate function
  const formatDate = (date: Date): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // ✅ formatTime function
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const calculateDuration = () => {
    if (rateType === 'day') {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } else {
      const startDateTime = new Date(startDate);
      startDateTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
      
      const endDateTime = new Date(startDate);
      const endHour = stopTime.getHours();
      const endMinute = stopTime.getMinutes();
      const startHour = startTime.getHours();
      
      if (endHour < startHour || (endHour === startHour && endMinute <= startTime.getMinutes())) {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }
      
      endDateTime.setHours(endHour, endMinute, 0, 0);
      
      const diffTime = endDateTime.getTime() - startDateTime.getTime();
      return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60)));
    }
  };

const handlePickupMethodChange = (method: 'vendor' | 'delivery') => {
  setPickupMethod(method);
  // ✅ REMOVE the auto-switch to self-drive
  // Users can now choose ride mode for both pickup methods
  if (method === 'vendor') {
    setDeliveryAddress(''); // Clear delivery address if switching to vendor
  }
};

  // ✅ CHECK AVAILABILITY FUNCTION
  const checkCarAvailability = async () => {
    try {
      const { db } = await import('../config/firebase');
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { parseDateTime } = await import('../utils/dateHelpers');

      // Parse selected dates/times
      const requestStart = parseDateTime(
        formatDate(startDate),
        formatTime(startTime)
      );
      const requestEnd = parseDateTime(
        formatDate(endDate),
        formatTime(stopTime)
      );

      // Get all active bookings for this car
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('carId', '==', carData.id),
        where('status', 'in', ['upcoming', 'ongoing'])
      );

      const snapshot = await getDocs(bookingsQuery);
      
      // Check each booking for conflicts
      for (const docSnapshot of snapshot.docs) {
        const booking = docSnapshot.data();
        
        const bookingStart = parseDateTime(
          booking.startDate,
          booking.startTime
        );
        const bookingEnd = parseDateTime(
          booking.endDate,
          booking.stopTime
        );

        // Check if dates overlap
        if (requestStart < bookingEnd && requestEnd > bookingStart) {
          Alert.alert(
            'Not Available',
            `This car is already booked from ${booking.startDate} to ${booking.endDate}. Please select different dates.`
          );
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking availability:', error);
      Alert.alert('Error', 'Could not check availability. Please try again.');
      return false;
    }
  };

  // ✅ SINGLE handleContinue function
const handleContinue = async () => {
  // Validate delivery address if delivery method
  if (pickupMethod === 'delivery' && !deliveryAddress.trim()) {
    Alert.alert('Error', 'Please enter a delivery address');
    return;
  }

  // ✅ CHECK AVAILABILITY
  const isAvailable = await checkCarAvailability();
  
  if (!isAvailable) {
    return;
  }

  // Continue with booking
  const tripData: TripData = {
    car: carData,
    pickupLocation: pickupMethod === 'vendor' 
      ? (carData.location || 'Vendor location') 
      : deliveryAddress,
    deliveryAddress: pickupMethod === 'delivery' ? deliveryAddress : undefined,
    pickupMethod,
    rideMode,
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    startTime: formatTime(startTime),
    stopTime: formatTime(stopTime),
    duration: calculateDuration(),
    durationType: rateType,
  };
  
  onContinue(tripData);
};

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Details</Text>
        <TouchableOpacity>
          <Text style={styles.removeButton}>Remove</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Car Card */}
        <View style={styles.carCard}>
          <View style={styles.carHeader}>
            <View>
              <Text style={styles.carModel}>{carData.model}</Text>
              <Text style={styles.carYear}>{carData.year}</Text>
            </View>
            <View>
              <Text style={styles.carPrice}>
                ₦{rateType === 'day' 
                  ? carData.pricePerDay.toLocaleString() 
                  : carData.pricePerHour.toLocaleString()}
                <Text style={styles.rateLabel}>/{rateType}</Text>
              </Text>
            </View>
          </View>
          
          {carData.photos && carData.photos.length > 0 ? (
  <Image 
    source={{ uri: carData.photos[0] }} 
    style={styles.carImage} 
    resizeMode="cover"
  />
) : (
  <View style={[styles.carImage, styles.carImagePlaceholder]}>
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
    <Text style={styles.specText}>{carData.seats || 4} seats</Text>
  </View>
  <View style={styles.specItem}>
    <Image
      source={require('../../assets/images/door.png')}
      style={styles.specIcon}
      resizeMode="contain"
    />
    <Text style={styles.specText}>{carData.doors || 4} doors</Text>
  </View>
  <View style={styles.specItem}>
    <Image
      source={require('../../assets/images/ac.png')}
      style={styles.specIcon}
      resizeMode="contain"
    />
    <Text style={styles.specText}>A/C</Text>
  </View>
  <View style={styles.specItem}>
    <Image
      source={require('../../assets/images/gear.png')}
      style={styles.specIcon}
      resizeMode="contain"
    />
    <Text style={styles.specText}>{carData.transmission || 'Automatic'}</Text>
  </View>
</View>
</View> 

        {/* Rate Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Select Rate Type</Text>
          <View style={styles.rateTabs}>
            <TouchableOpacity
              style={[styles.rateTab, rateType === 'day' && styles.rateTabActive]}
              onPress={() => setRateType('day')}
            >
              <Text style={[styles.rateTabText, rateType === 'day' && styles.rateTabTextActive]}>
                Per Day
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rateTab, rateType === 'hour' && styles.rateTabActive]}
              onPress={() => setRateType('hour')}
            >
              <Text style={[styles.rateTabText, rateType === 'hour' && styles.rateTabTextActive]}>
                Per Hour
              </Text>
            </TouchableOpacity>
          </View>
        </View>

{/* Pickup Method */}
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Pickup Method</Text>
  
  <View style={styles.optionsContainer}>
    {/* Pickup at Vendor */}
    <TouchableOpacity
      style={[
        styles.optionCard,
        pickupMethod === 'vendor' && styles.optionCardActive,
      ]}
      onPress={() => handlePickupMethodChange('vendor')}
    >
      <View style={styles.optionContent}>
        <View style={styles.optionIconContainer}>
          <Text style={styles.optionIcon}>📍</Text>
        </View>
        <View style={styles.optionTextContainer}>
          <Text
            style={[
              styles.optionTitle,
              pickupMethod === 'vendor' && styles.optionTitleActive,
            ]}
          >
            Pickup at Vendor
          </Text>
          <Text style={styles.optionDescription}>
            {carData.location || 'Vendor location'} {/* ✅ USE REAL LOCATION */}
          </Text>
        </View>
      </View>
      {pickupMethod === 'vendor' && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>

    {/* Delivery to Address */}
    <TouchableOpacity
      style={[
        styles.optionCard,
        pickupMethod === 'delivery' && styles.optionCardActive,
      ]}
      onPress={() => handlePickupMethodChange('delivery')}
    >
      <View style={styles.optionContent}>
        <View style={styles.optionIconContainer}>
          <Text style={styles.optionIcon}>🚚</Text>
        </View>
        <View style={styles.optionTextContainer}>
          <Text
            style={[
              styles.optionTitle,
              pickupMethod === 'delivery' && styles.optionTitleActive,
            ]}
          >
            Delivery to Address
          </Text>
          <Text style={styles.optionDescription}>
            We'll bring the car to you
          </Text>
        </View>
      </View>
      {pickupMethod === 'delivery' && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  </View>

  {/* ✅ Delivery Address Input (only if delivery selected) */}
  {pickupMethod === 'delivery' && (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>Delivery Address</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Enter your delivery address"
        placeholderTextColor={colors.textSecondary}
        value={deliveryAddress}
        onChangeText={setDeliveryAddress}
        multiline
        numberOfLines={3}
      />
    </View>
  )}
</View>

{/* ✅ Ride Mode (SHOW FOR BOTH METHODS NOW) */}
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Ride Mode</Text>
  
  <View style={styles.optionsContainer}>
    {/* Self Drive */}
    <TouchableOpacity
      style={[
        styles.optionCard,
        rideMode === 'self-drive' && styles.optionCardActive,
      ]}
      onPress={() => setRideMode('self-drive')}
    >
      <View style={styles.optionContent}>
        <View style={styles.optionIconContainer}>
          <Text style={styles.optionIcon}>🚗</Text>
        </View>
        <View style={styles.optionTextContainer}>
          <Text
            style={[
              styles.optionTitle,
              rideMode === 'self-drive' && styles.optionTitleActive,
            ]}
          >
            Self Drive
          </Text>
          <Text style={styles.optionDescription}>
            Drive yourself
          </Text>
        </View>
      </View>
      {rideMode === 'self-drive' && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>

    {/* With Driver */}
    <TouchableOpacity
      style={[
        styles.optionCard,
        rideMode === 'with-driver' && styles.optionCardActive,
      ]}
      onPress={() => setRideMode('with-driver')}
    >
      <View style={styles.optionContent}>
        <View style={styles.optionIconContainer}>
          <Text style={styles.optionIcon}>👨‍✈️</Text>
        </View>
        <View style={styles.optionTextContainer}>
          <Text
            style={[
              styles.optionTitle,
              rideMode === 'with-driver' && styles.optionTitleActive,
            ]}
          >
            With Driver
          </Text>
          <Text style={styles.optionDescription}>
            Professional driver included
          </Text>
        </View>
      </View>
      {rideMode === 'with-driver' && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  </View>
</View>

        {/* Date and Time Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Date and Time</Text>

          <View style={styles.dateTimeRow}>
            <Text style={styles.inputLabel}>Start Date</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Text style={styles.dateTimeText}>{formatDate(startDate)}</Text>
            </TouchableOpacity>
          </View>

          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowStartDatePicker(false);
                if (selectedDate) setStartDate(selectedDate);
              }}
            />
          )}

          <View style={styles.dateTimeRow}>
            <Text style={styles.inputLabel}>Start Time</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowStartTimePicker(true)}
            >
              <Text style={styles.dateTimeText}>{formatTime(startTime)}</Text>
            </TouchableOpacity>
          </View>

          {showStartTimePicker && (
            <DateTimePicker
              value={startTime}
              mode="time"
              display="default"
              onChange={(event, selectedTime) => {
                setShowStartTimePicker(false);
                if (selectedTime) setStartTime(selectedTime);
              }}
            />
          )}

          {rateType === 'day' && (
            <>
              <View style={styles.dateTimeRow}>
                <Text style={styles.inputLabel}>End Date</Text>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text style={styles.dateTimeText}>{formatDate(endDate)}</Text>
                </TouchableOpacity>
              </View>

              {showEndDatePicker && (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowEndDatePicker(false);
                    if (selectedDate) setEndDate(selectedDate);
                  }}
                />
              )}
            </>
          )}

          <View style={styles.dateTimeRow}>
            <Text style={styles.inputLabel}>Stop Time</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowStopTimePicker(true)}
            >
              <Text style={styles.dateTimeText}>{formatTime(stopTime)}</Text>
            </TouchableOpacity>
          </View>

          {showStopTimePicker && (
            <DateTimePicker
              value={stopTime}
              mode="time"
              display="default"
              onChange={(event, selectedTime) => {
                setShowStopTimePicker(false);
                if (selectedTime) setStopTime(selectedTime);
              }}
            />
          )}

          <View style={styles.durationContainer}>
            <Image
              source={require('../../assets/images/clock.png')}
              style={styles.clockIcon}
              resizeMode="contain"
            />
            <Text style={styles.durationText}>
              Total duration for trip is {calculateDuration()} {rateType === 'day' ? 'days' : 'hours'}
            </Text>
          </View>
        </View>
      </ScrollView>
      

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
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
  removeButton: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  carCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  rateLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
  },
 carImage: {
  width: '100%',
  height: 160,  // ✅ Increase from 120 to 160 or 180
  marginVertical: 12,
  borderRadius: 8,  // ✅ Add border radius
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
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  rateTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  rateTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  rateTabActive: {
    backgroundColor: colors.primary,
  },
  rateTabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  rateTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor:  colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  locationContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  locationIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  dateTimeRow: {
    marginBottom: 16,
  },
  dateTimeButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
  },
  dateTimeText: {
    fontSize: 14,
    color: '#000',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  clockIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
  durationText: {
    fontSize: 13,
    color: '#065F46',
  },
  footer: {
    padding: 20,
    backgroundColor: '#E8EAF6',
  },
  continueButton: {
    backgroundColor:  colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  carImagePlaceholder: {
  backgroundColor: colors.inputBackground,
  justifyContent: 'center',
  alignItems: 'center',
},
carImageEmoji: {
  fontSize: 60,
},
optionsContainer: {
  gap: spacing.md,
},
optionCard: {
  backgroundColor: colors.background,
  borderRadius: borderRadius.lg,
  padding: spacing.sm,
  borderWidth: 2,
  borderColor: colors.border,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
},
optionCardActive: {
  borderColor: colors.primary,
  backgroundColor: colors.background,
},
optionContent: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
},
optionIconContainer: {
  width: 50,
  height: 50,
  borderRadius: borderRadius.md,
  backgroundColor: colors.backgroundGray,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: spacing.md,
},
optionIcon: {
  fontSize: 24,
},
optionTextContainer: {
  flex: 1,
},
optionTitle: {
  fontSize: typography.fontSize.base,
  fontWeight: '600',
  color: colors.text,
  marginBottom: 4,
},
optionTitleActive: {
  color: colors.primary,
},
optionDescription: {
  fontSize: typography.fontSize.sm,
  color: colors.textSecondary,
},
checkmark: {
  width: 24,
  height: 24,
  borderRadius: 12,
  backgroundColor: colors.primary,
  justifyContent: 'center',
  alignItems: 'center',
  marginLeft: spacing.sm,
},
checkmarkText: {
  color: colors.background,
  fontSize: 16,
  fontWeight: 'bold',
},
inputContainer: {
  marginTop: spacing.md,
},
textInput: {
  backgroundColor: colors.background,
  borderRadius: borderRadius.md,
  padding: spacing.md,
  fontSize: typography.fontSize.base,
  color: colors.text,
  borderWidth: 1,
  borderColor: colors.border,
  minHeight: 50,
  textAlignVertical: 'top',

},
sectionTitle: {
  fontSize: typography.fontSize.lg,
  fontWeight: '700',
  color: colors.text,
  marginBottom: spacing.md,
},
});
            
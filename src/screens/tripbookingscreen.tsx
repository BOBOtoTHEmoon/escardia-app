import React, { useState, useEffect } from 'react';
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
   savedFormData?: any;  // ← ADD
  onFormDataChange?: (data: any) => void;  // ← ADD
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

// ✅ Minimum hours ahead for booking
const MINIMUM_HOURS_AHEAD = 3;

export const TripBookingScreen: React.FC<TripBookingScreenProps> = ({
  carData,
  onNavigateBack,
  onContinue,
  savedFormData,
  onFormDataChange,
}) => {
  // ✅ Initialize dates/times with minimum booking time (3 hours ahead)
  const getMinimumStartTime = () => {
    const minTime = new Date();
    minTime.setHours(minTime.getHours() + MINIMUM_HOURS_AHEAD);
    minTime.setMinutes(0, 0, 0); // Round to the hour
    return minTime;
  };

  const [pickupMethod, setPickupMethod] = useState<'vendor' | 'delivery'>(
    savedFormData?.pickupMethod || 'vendor'
  );
  const [rideMode] = useState<'self-drive' | 'with-driver'>('with-driver'); // ✅ Fixed to with-driver
  const [rateType, setRateType] = useState<'day' | 'hour'>(
    savedFormData?.rateType || 'day'
  );
  const [deliveryAddress, setDeliveryAddress] = useState(
    savedFormData?.deliveryAddress || ''
  );

  // Date and Time states
  const [startDate, setStartDate] = useState(
    savedFormData?.startDate ? new Date(savedFormData.startDate) : getMinimumStartTime()
  );
  const [endDate, setEndDate] = useState(
    savedFormData?.endDate ? new Date(savedFormData.endDate) : getMinimumStartTime()
  );
  const [startTime, setStartTime] = useState(
    savedFormData?.startTime ? new Date(savedFormData.startTime) : getMinimumStartTime()
  );
  const [stopTime, setStopTime] = useState(() => {
    if (savedFormData?.stopTime) return new Date(savedFormData.stopTime);
    const defaultStop = getMinimumStartTime();
    defaultStop.setHours(defaultStop.getHours() + 1);
    return defaultStop;
  });
  
  // Date picker visibility
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showStopTimePicker, setShowStopTimePicker] = useState(false);

  // ✅ Validation error messages
  const [timeError, setTimeError] = useState<string | null>(null);

  // ✅ formatDate function
  const formatDate = (date: Date): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // ✅ formatTime function
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // ✅ Check if selected time is valid (at least 3 hours ahead)
  const validateBookingTime = (selectedDate: Date, selectedTime: Date): { valid: boolean; message: string | null } => {
    const now = new Date();
    const minimumTime = new Date();
    minimumTime.setHours(minimumTime.getHours() + MINIMUM_HOURS_AHEAD);

    // Combine date and time
    const bookingDateTime = new Date(selectedDate);
    bookingDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);

    // Check if booking time is in the past
    if (bookingDateTime < now) {
      return {
        valid: false,
        message: 'You cannot book for a time in the past. Please select a future time.',
      };
    }

    // Check if booking time is at least 3 hours ahead
    if (bookingDateTime < minimumTime) {
      const minTimeFormatted = formatTime(minimumTime);
      return {
        valid: false,
        message: `Bookings must be at least ${MINIMUM_HOURS_AHEAD} hours in advance. The earliest available time is ${minTimeFormatted} today.`,
      };
    }

    return { valid: true, message: null };
  };

  // ✅ Validate whenever date/time changes
  useEffect(() => {
    const validation = validateBookingTime(startDate, startTime);
    setTimeError(validation.message);
  }, [startDate, startTime]);

  // Save form data when anything changes
useEffect(() => {
  if (onFormDataChange) {
    onFormDataChange({
      pickupMethod,
      rateType,
      deliveryAddress,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      startTime: startTime.toISOString(),
      stopTime: stopTime.toISOString(),
    });
  }
}, [pickupMethod, rateType, deliveryAddress, startDate, endDate, startTime, stopTime]);

  // ✅ Validate end date is not before start date
  const validateEndDate = (): { valid: boolean; message: string | null } => {
    if (rateType === 'day') {
      const startDateTime = new Date(startDate);
      startDateTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);

      const endDateTime = new Date(endDate);
      endDateTime.setHours(stopTime.getHours(), stopTime.getMinutes(), 0, 0);

      if (endDateTime <= startDateTime) {
        return {
          valid: false,
          message: 'End date/time must be after start date/time.',
        };
      }
    }
    return { valid: true, message: null };
  };

  const calculateDuration = () => {
    if (rateType === 'day') {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(1, days); // Minimum 1 day
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
    if (method === 'vendor') {
      setDeliveryAddress('');
    }
  };

  // ✅ Handle start date change with validation
  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        Alert.alert('Invalid Date', 'You cannot select a date in the past.');
        return;
      }
      
      setStartDate(selectedDate);
      
      // If end date is before new start date, update it
      if (endDate < selectedDate) {
        setEndDate(selectedDate);
      }
    }
  };

  // ✅ Handle end date change with validation
  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      if (selectedDate < startDate) {
        Alert.alert('Invalid Date', 'End date cannot be before start date.');
        return;
      }
      setEndDate(selectedDate);
    }
  };

  // ✅ Handle start time change with validation
  const handleStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      setStartTime(selectedTime);
    }
  };

  // ✅ Handle stop time change with validation
  const handleStopTimeChange = (event: any, selectedTime?: Date) => {
    setShowStopTimePicker(false);
    if (selectedTime) {
      setStopTime(selectedTime);
    }
  };

  // ✅ CHECK AVAILABILITY FUNCTION
  const checkCarAvailability = async () => {
    try {
      const { db } = await import('../config/firebase');
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { parseDateTime } = await import('../utils/dateHelpers');

      const requestStart = parseDateTime(
        formatDate(startDate),
        formatTime(startTime)
      );
      const requestEnd = parseDateTime(
        formatDate(endDate),
        formatTime(stopTime)
      );

      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('carId', '==', carData.id),
        where('status', 'in', ['upcoming', 'ongoing'])
      );

      const snapshot = await getDocs(bookingsQuery);
      
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

  // ✅ HANDLE CONTINUE WITH FULL VALIDATION
  const handleContinue = async () => {
    // 1. Validate delivery address if delivery method
    if (pickupMethod === 'delivery' && !deliveryAddress.trim()) {
      Alert.alert('Missing Information', 'Please enter a delivery address.');
      return;
    }

    // 2. Validate booking time (at least 3 hours ahead)
    const timeValidation = validateBookingTime(startDate, startTime);
    if (!timeValidation.valid) {
      Alert.alert('Invalid Time', timeValidation.message || 'Please select a valid time.');
      return;
    }

    // 3. Validate end date/time
    const endValidation = validateEndDate();
    if (!endValidation.valid) {
      Alert.alert('Invalid Date', endValidation.message || 'Please check your dates.');
      return;
    }

    // 4. Check car availability
    const isAvailable = await checkCarAvailability();
    if (!isAvailable) {
      return;
    }

    // 5. All validations passed - continue
    const tripData: TripData = {
      car: carData,
      pickupLocation: pickupMethod === 'vendor' 
        ? (carData.location || 'Vendor location') 
        : deliveryAddress,
      deliveryAddress: pickupMethod === 'delivery' ? deliveryAddress : undefined,
      pickupMethod,
      rideMode: 'with-driver', // ✅ Always with-driver for now
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      startTime: formatTime(startTime),
      stopTime: formatTime(stopTime),
      duration: calculateDuration(),
      durationType: rateType,
    };
    
    onContinue(tripData);
  };

  // ✅ Get minimum date for date picker (today)
  const getMinimumDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
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
                    {carData.location || 'Vendor location'}
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

          {/* Delivery Address Input */}
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

        {/* ✅ Ride Mode - Fixed to With Driver */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ride Mode</Text>
          
          <View style={styles.optionsContainer}>
            {/* With Driver - Only Option */}
            <View style={[styles.optionCard, styles.optionCardActive]}>
              <View style={styles.optionContent}>
                <View style={styles.optionIconContainer}>
                  <Text style={styles.optionIcon}>👨‍✈️</Text>
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionTitle, styles.optionTitleActive]}>
                    With Driver
                  </Text>
                  <Text style={styles.optionDescription}>
                    Professional driver included
                  </Text>
                </View>
              </View>
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            </View>

            {/* ✅ Coming Soon Badge for Self Drive */}
            <View style={[styles.optionCard, styles.optionCardDisabled]}>
              <View style={styles.optionContent}>
                <View style={[styles.optionIconContainer, styles.optionIconDisabled]}>
                  <Text style={styles.optionIcon}>🚗</Text>
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionTitle, styles.optionTitleDisabled]}>
                    Self Drive
                  </Text>
                  <Text style={styles.optionDescription}>
                    Coming soon
                  </Text>
                </View>
              </View>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Soon</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Date and Time Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Date and Time</Text>

          {/* ✅ Booking Notice */}
          <View style={styles.noticeContainer}>
            <Text style={styles.noticeIcon}>ℹ️</Text>
            <Text style={styles.noticeText}>
              Bookings must be made at least {MINIMUM_HOURS_AHEAD} hours in advance to allow preparation time.
            </Text>
          </View>

          {/* ✅ Error Message */}
          {timeError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{timeError}</Text>
            </View>
          )}

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
              minimumDate={getMinimumDate()}
              onChange={handleStartDateChange}
            />
          )}

          <View style={styles.dateTimeRow}>
            <Text style={styles.inputLabel}>Start Time</Text>
            <TouchableOpacity
              style={[styles.dateTimeButton, timeError && styles.dateTimeButtonError]}
              onPress={() => setShowStartTimePicker(true)}
            >
              <Text style={[styles.dateTimeText, timeError && styles.dateTimeTextError]}>
                {formatTime(startTime)}
              </Text>
            </TouchableOpacity>
          </View>

          {showStartTimePicker && (
            <DateTimePicker
              value={startTime}
              mode="time"
              display="default"
              onChange={handleStartTimeChange}
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
                  minimumDate={startDate}
                  onChange={handleEndDateChange}
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
              onChange={handleStopTimeChange}
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
        <TouchableOpacity 
          style={[styles.continueButton, timeError && styles.continueButtonDisabled]} 
          onPress={handleContinue}
          disabled={!!timeError}
        >
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
    height: 160,
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
  inputLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  dateTimeRow: {
    marginBottom: 16,
  },
  dateTimeButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
  },
  dateTimeButtonError: {
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  dateTimeText: {
    fontSize: 14,
    color: '#000',
  },
  dateTimeTextError: {
    color: '#EF4444',
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
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: colors.primary + '60',
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
  optionCardDisabled: {
    borderColor: colors.border,
    backgroundColor: '#F3F4F6',
    opacity: 0.7,
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
  optionIconDisabled: {
    backgroundColor: '#E5E7EB',
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
  optionTitleDisabled: {
    color: '#9CA3AF',
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
  comingSoonBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: spacing.sm,
  },
  comingSoonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
  // ✅ NEW: Notice styles
  noticeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  noticeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  // ✅ NEW: Error styles
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 18,
  },
});
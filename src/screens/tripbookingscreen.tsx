import React, { useEffect, useMemo, useState } from 'react';
import { MapPicker } from '../components/MapPicker';
import { TripMap } from '../components/TripMap';
import { extraHourPrice, priceRental, rentalLabel } from '../utils/rental';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useAppSettings } from '../hooks/useAppSettings';
import { AppText, Banner, Button, Screen, ScreenHeader } from '../ui';
import { BookingSteps, BottomBar, DateTimeField, OptionCard, Panel, SectionTitle } from '../ui/Booking';
import { naira } from '../ui/CarCard';
import { Chip } from '../components/filtermodal';
import { color, font, gutter, radius, themed, statusBarStyle, isDark } from '../theme';
import { FEATURES } from '../config/features';

interface TripBookingScreenProps {
  carData: {
    id: string;
    brand: string;
    model: string;
    year: string;
    pricePerDay: number;
    pricePerHour: number;
    photos?: string[];
    location?: string;
    [key: string]: any;
  };
  onNavigateBack: () => void;
  onContinue: (tripData: TripData) => void;
  savedFormData?: any;
  onFormDataChange?: (data: any) => void;
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
  extraHours: number;
  pickupLat?: number | null;
  pickupLng?: number | null;
}

const DAY = 24 * 60 * 60 * 1000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// These two formats are what the booking service parses, so keep them exactly.
const formatDate = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
const shortDay = (d: Date) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

const at = (date: Date, time: Date) => {
  const d = new Date(date);
  d.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return d;
};
const midnight = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const earliestStart = (hours: number) => {
  const d = new Date(Date.now() + hours * 3600 * 1000);
  // Round up to the next half hour
  d.setMinutes(d.getMinutes() > 30 ? 60 : 30, 0, 0);
  return d;
};

export const TripBookingScreen: React.FC<TripBookingScreenProps> = ({ carData, onNavigateBack, onContinue, savedFormData, onFormDataChange }) => {
  const { settings } = useAppSettings();
  const minHours = settings.minHoursBeforeStart;
  const offersHourly = Number(carData.pricePerHour) > 0;

  const initialStart = savedFormData?.startDate ? new Date(savedFormData.startDate) : earliestStart(3);
  // Every trip has a driver, so the driver comes to the customer. The choice between
  // meeting at the vendor and delivery only returns with self-drive.
  const driverComes = !FEATURES.selfDrive;
  const [pickupMethod, setPickupMethod] = useState<'vendor' | 'delivery'>(driverComes ? 'delivery' : savedFormData?.pickupMethod || 'vendor');
  const [deliveryAddress, setDeliveryAddress] = useState<string>(savedFormData?.deliveryAddress || '');
  // Exact pick-up point chosen on the map, plus optional directions for the driver.
  const [pickupCoords, setPickupCoords] = useState<{ latitude: number; longitude: number } | null>(savedFormData?.pickupCoords ?? null);
  const [pickupNote, setPickupNote] = useState<string>(savedFormData?.pickupNote || '');
  const [picking, setPicking] = useState(false);
  const [startDate, setStartDate] = useState<Date>(initialStart);
  const [startTime, setStartTime] = useState<Date>(savedFormData?.startTime ? new Date(savedFormData.startTime) : initialStart);
  const [endDate, setEndDate] = useState<Date>(() => {
    const saved = savedFormData?.endDate ? new Date(savedFormData.endDate) : null;
    return saved && midnight(saved) >= midnight(initialStart) ? saved : new Date(initialStart.getTime() + DAY);
  });
  // Return time defaults to the pick-up time, so a new booking starts as exactly one day.
  const [stopTime, setStopTime] = useState<Date>(() => (savedFormData?.stopTime ? new Date(savedFormData.stopTime) : initialStart));
  const [checking, setChecking] = useState(false);

  // Remember the form if the customer goes back and forth.
  useEffect(() => {
    onFormDataChange?.({
      pickupMethod,
      deliveryAddress,
      pickupCoords,
      pickupNote,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      startTime: startTime.toISOString(),
      stopTime: stopTime.toISOString(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupMethod, deliveryAddress, pickupCoords, pickupNote, startDate, endDate, startTime, stopTime]);

  const start = at(startDate, startTime);
  const end = at(endDate, stopTime);
  // Same rules the server uses (see utils/rental.ts and quote_booking).
  const trip = priceRental(start, end, carData.pricePerDay, carData.pricePerHour);
  const rental = trip.base;

  const returnError = useMemo(() => {
    if (end <= start) return 'The return time must be after the pick-up time.';
    if (trip.hours > 90 * 24) return 'Bookings can be up to 90 days.';
    return null;
  }, [start, end, trip.hours]);

  // Explains how the time is charged, under the dates.
  // Short trips never cost more than one day. Say so when the cap kicks in, so the price makes sense.
  const hourlyTotal = trip.durationType === 'hour' ? trip.duration * Number(carData.pricePerHour || 0) : 0;
  const dayCap = trip.durationType === 'hour' && Number(carData.pricePerDay) > 0 && hourlyTotal > Number(carData.pricePerDay);
  const priceNote =
    trip.durationType === 'hour'
      ? dayCap
        ? `${trip.duration} hours at ${naira(carData.pricePerHour)} would be ${naira(hourlyTotal)}, so you pay the full-day price of ${naira(carData.pricePerDay)} instead.`
        : `Charged by the hour at ${naira(carData.pricePerHour)} per hour.`
      : trip.extraHours > 0
        ? `${trip.extraHours} extra hour${trip.extraHours === 1 ? '' : 's'} at ${naira(extraHourPrice(carData.pricePerDay))} per hour (the day price split by 24).`
        : `Returning after ${formatTime(start)} adds ${naira(extraHourPrice(carData.pricePerDay))} per extra hour.`;

  const timeError = useMemo(() => {
    const min = new Date(Date.now() + minHours * 3600 * 1000);
    if (start < new Date()) return 'That time has already passed. Pick a later time.';
    if (start < min) return `Book at least ${minHours} hours ahead. The earliest pick-up is ${shortDay(min)}, ${formatTime(min)}.`;
    return null;
  }, [start, minHours]);

  const changeStartDate = (d: Date) => {
    setStartDate(d);
    if (midnight(endDate) < midnight(d)) setEndDate(new Date(midnight(d).getTime() + DAY));
  };

  const handleContinue = async () => {
    if (driverComes && !pickupCoords) {
      Alert.alert('Where should your driver pick you up?', 'Choose your pick-up point on the map.');
      return;
    }
    if (pickupMethod === 'delivery' && !deliveryAddress.trim()) {
      Alert.alert(
        driverComes ? 'Where should your driver pick you up?' : 'Where should we bring it?',
        driverComes ? 'Enter your pick-up address.' : 'Enter the delivery address.'
      );
      return;
    }
    if (timeError) {
      Alert.alert('Choose another time', timeError);
      return;
    }
    if (returnError) {
      Alert.alert('Check your return time', returnError);
      return;
    }

    setChecking(true);
    try {
      const { checkCarAvailability } = await import('../services/carservice');
      const result = await checkCarAvailability(carData.id, start, end);
      if (!result.available) {
        const from = result.conflictStart ? new Date(result.conflictStart) : null;
        const to = result.conflictEnd ? new Date(result.conflictEnd) : null;
        Alert.alert(
          'Already booked',
          from && to
            ? `This car is booked from ${shortDay(from)}, ${formatTime(from)} to ${shortDay(to)}, ${formatTime(to)}. Try different times.`
            : result.message || 'This car is not free for those times.'
        );
        return;
      }
    } finally {
      setChecking(false);
    }

    // The address from the map, plus the customer's own directions for the driver.
    const fullAddress = [deliveryAddress.trim(), pickupNote.trim()].filter(Boolean).join(' · ');
    onContinue({
      car: carData,
      pickupLocation: pickupMethod === 'vendor' ? carData.location || 'Vendor location' : fullAddress,
      deliveryAddress: pickupMethod === 'delivery' ? fullAddress : undefined,
      pickupLat: pickupMethod === 'delivery' ? pickupCoords?.latitude ?? null : null,
      pickupLng: pickupMethod === 'delivery' ? pickupCoords?.longitude ?? null : null,
      pickupMethod,
      rideMode: 'with-driver',
      startDate: formatDate(start),
      endDate: formatDate(end),
      startTime: formatTime(start),
      stopTime: formatTime(end),
      duration: trip.duration,
      durationType: trip.durationType,
      extraHours: trip.extraHours,
    });
  };

  return (
    <Screen>
      <StatusBar style={statusBarStyle()} />
      <ScreenHeader title="Book your trip" onBack={onNavigateBack} />
      <BookingSteps current={1} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 140 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Car */}
          <Panel style={styles.car}>
            {carData.photos?.[0] ? (
              <Image source={{ uri: carData.photos[0] }} style={styles.carPhoto} />
            ) : (
              <View style={[styles.carPhoto, { alignItems: 'center', justifyContent: 'center' }]}>
                <Feather name="image" size={18} color={color.subtle} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <AppText variant="subheading" numberOfLines={1}>
                {carData.brand} {carData.model}
              </AppText>
              <AppText variant="small" color={color.muted}>
                {carData.year} · With driver
              </AppText>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <AppText variant="subheading">{naira(carData.pricePerDay)}</AppText>
              <AppText variant="small" color={color.muted}>
                {offersHourly ? `per day · ${naira(carData.pricePerHour)}/hr` : 'per day'}
              </AppText>
            </View>
          </Panel>

          {/* When */}
          <SectionTitle title="When?" hint={`Book at least ${minHours} hours ahead so the vendor can prepare the car.`} />
          {!!timeError && <Banner text={timeError} />}
          <Panel>
            <AppText variant="caption" color={color.muted} style={{ marginBottom: 8 }}>
              Pick-up
            </AppText>
            <View style={styles.dtRow}>
              <DateTimeField label="Date" mode="date" value={startDate} display={shortDay(startDate)} minimumDate={midnight(new Date())} onChange={changeStartDate} error={!!timeError} />
              <DateTimeField label="Time" mode="time" value={startTime} display={formatTime(startTime)} onChange={setStartTime} error={!!timeError} />
            </View>

            <View style={styles.divider} />

            <AppText variant="caption" color={color.muted} style={{ marginBottom: 8 }}>
              Return
            </AppText>
            <View style={styles.dtRow}>
              <DateTimeField label="Date" mode="date" value={endDate} display={shortDay(endDate)} minimumDate={midnight(startDate)} onChange={setEndDate} error={!!returnError} />
              <DateTimeField label="Time" mode="time" value={stopTime} display={formatTime(stopTime)} onChange={setStopTime} error={!!returnError} />
            </View>
            {!!returnError && (
              <AppText variant="small" color={color.danger} style={{ marginTop: 8 }}>
                {returnError}
              </AppText>
            )}

            <View style={styles.duration}>
              <Feather name="clock" size={15} color={color.primary} />
              <AppText variant="smallMedium" color={color.primary} style={{ flex: 1 }}>
                {rentalLabel(trip)} · {shortDay(start)} to {shortDay(end)}
              </AppText>
            </View>
            {!returnError && (
              <AppText variant="small" color={color.muted} style={{ marginTop: 10 }}>
                {priceNote}
              </AppText>
            )}
          </Panel>

          {/* Pick-up */}
          {driverComes ? (
            <>
              <SectionTitle title="Pick-up point" hint="Your driver brings the car and picks you up here." />
              {pickupCoords ? (
                <Panel style={{ padding: 0, overflow: 'hidden' }}>
                  <TripMap coords={pickupCoords} address={deliveryAddress} label="Pick-up" height={150} showDirections={false} onPress={() => setPicking(true)} />
                  <Pressable onPress={() => setPicking(true)} style={styles.pickRow}>
                    <Feather name="map-pin" size={16} color={color.primary} />
                    <AppText variant="bodyMedium" numberOfLines={2} style={{ flex: 1 }}>
                      {deliveryAddress}
                    </AppText>
                    <AppText variant="smallMedium" color={color.primary}>
                      Change
                    </AppText>
                  </Pressable>
                </Panel>
              ) : (
                <Pressable onPress={() => setPicking(true)} style={({ pressed }) => [styles.choose, pressed && { opacity: 0.85 }]}>
                  <View style={styles.chooseIcon}>
                    <Feather name="map" size={18} color={color.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="subheading">Choose on map</AppText>
                    <AppText variant="small" color={color.muted}>
                      Search or drag the pin to your exact spot
                    </AppText>
                  </View>
                  <Feather name="chevron-right" size={18} color={color.muted} />
                </Pressable>
              )}
              <TextInput
                keyboardAppearance={isDark() ? 'dark' : 'light'}
                value={pickupNote}
                onChangeText={setPickupNote}
                placeholder="House number, gate colour or a landmark (optional)"
                placeholderTextColor={color.subtle}
                multiline
                style={styles.address}
              />
              <MapPicker
                visible={picking}
                initial={pickupCoords}
                onClose={() => setPicking(false)}
                onConfirm={(p) => {
                  setPickupCoords({ latitude: p.latitude, longitude: p.longitude });
                  setDeliveryAddress(p.address);
                  setPicking(false);
                }}
              />
            </>
          ) : (
          <>
          <SectionTitle title="Getting the car" />
          <OptionCard
            icon="map-pin"
            title="Meet at the vendor"
            subtitle={carData.location || 'The vendor shares the exact address after booking'}
            selected={pickupMethod === 'vendor'}
            onPress={() => setPickupMethod('vendor')}
          />
          <OptionCard
            icon="truck"
            title="Deliver to me"
            subtitle={`We bring the car to you · ${naira(settings.deliveryFee)}`}
            selected={pickupMethod === 'delivery'}
            onPress={() => setPickupMethod('delivery')}
          >
            {pickupMethod === 'delivery' && (
              <TextInput
                keyboardAppearance={isDark() ? 'dark' : 'light'}
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                placeholder="House number, street and area"
                placeholderTextColor={color.subtle}
                multiline
                style={styles.address}
              />
            )}
          </OptionCard>
          </>
          )}

          {/* Driver */}
          <SectionTitle title="Driver" />
          <OptionCard icon="user-check" title="Professional driver included" subtitle="Every Escardia trip comes with a vetted driver." selected />
          {FEATURES.selfDrive && (
            <OptionCard
              icon="key"
              title="Self-drive"
              subtitle="Rent the car and drive it yourself."
              selected={false}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomBar
        label="Car rental"
        amount={naira(rental)}
        note={rentalLabel(trip)}
        button={<Button title="Continue" iconRight="arrow-right" onPress={handleContinue} loading={checking} />}
      />
    </Screen>
  );
};

const styles = themed(() => StyleSheet.create({
  car: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  carPhoto: { width: 64, height: 48, borderRadius: 10, backgroundColor: color.sunken },
  dailyOnly: { justifyContent: 'center', paddingHorizontal: 4 },
  dtRow: { flexDirection: 'row', gap: 10 },
  dtFixed: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: color.sunken,
  },
  divider: { height: 1, backgroundColor: color.border, marginVertical: 16 },
  duration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: color.primarySoft,
  },
  address: {
    marginTop: 12,
    minHeight: 70,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
    fontFamily: font.regular,
    fontSize: 15,
    color: color.ink,
    textAlignVertical: 'top',
  },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  choose: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  chooseIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: color.primarySoft, alignItems: 'center', justifyContent: 'center' },
  soon: { paddingHorizontal: 8, height: 22, borderRadius: 11, backgroundColor: color.sunken, justifyContent: 'center' },
}));

import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useAppSettings } from '../hooks/useAppSettings';
import { AppText, Banner, Button, Screen, ScreenHeader } from '../ui';
import { BookingSteps, BottomBar, DateTimeField, OptionCard, Panel, SectionTitle } from '../ui/Booking';
import { naira } from '../ui/CarCard';
import { Chip } from '../components/filtermodal';
import { color, font, gutter, radius, themed, statusBarStyle, isDark } from '../theme';

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
  const [rateType, setRateType] = useState<'day' | 'hour'>(offersHourly && savedFormData?.rateType === 'hour' ? 'hour' : 'day');
  const [pickupMethod, setPickupMethod] = useState<'vendor' | 'delivery'>(savedFormData?.pickupMethod || 'vendor');
  const [deliveryAddress, setDeliveryAddress] = useState<string>(savedFormData?.deliveryAddress || '');
  const [startDate, setStartDate] = useState<Date>(initialStart);
  const [startTime, setStartTime] = useState<Date>(savedFormData?.startTime ? new Date(savedFormData.startTime) : initialStart);
  const [endDate, setEndDate] = useState<Date>(() => {
    const saved = savedFormData?.endDate ? new Date(savedFormData.endDate) : null;
    return saved && midnight(saved) > midnight(initialStart) ? saved : new Date(initialStart.getTime() + DAY);
  });
  const [stopTime, setStopTime] = useState<Date>(() =>
    savedFormData?.stopTime ? new Date(savedFormData.stopTime) : new Date(initialStart.getTime() + 2 * 3600 * 1000)
  );
  const [checking, setChecking] = useState(false);

  // Remember the form if the customer goes back and forth.
  useEffect(() => {
    onFormDataChange?.({
      pickupMethod,
      rateType,
      deliveryAddress,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      startTime: startTime.toISOString(),
      stopTime: stopTime.toISOString(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupMethod, rateType, deliveryAddress, startDate, endDate, startTime, stopTime]);

  const start = at(startDate, startTime);

  // Daily trips end at the same time of day as they start (that is how the server prices them).
  const end = useMemo(() => {
    if (rateType === 'day') return at(endDate, startTime);
    const e = at(startDate, stopTime);
    if (e <= start) e.setDate(e.getDate() + 1);
    return e;
  }, [rateType, endDate, startDate, startTime, stopTime, start]);

  const duration =
    rateType === 'day'
      ? Math.max(1, Math.round((midnight(endDate).getTime() - midnight(startDate).getTime()) / DAY))
      : Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (3600 * 1000)));

  const unitPrice = rateType === 'day' ? carData.pricePerDay : carData.pricePerHour;
  const rental = unitPrice * duration;

  const timeError = useMemo(() => {
    const min = new Date(Date.now() + minHours * 3600 * 1000);
    if (start < new Date()) return 'That time has already passed. Pick a later time.';
    if (start < min) return `Book at least ${minHours} hours ahead. The earliest pick-up is ${shortDay(min)}, ${formatTime(min)}.`;
    return null;
  }, [start, minHours]);

  const changeStartDate = (d: Date) => {
    setStartDate(d);
    if (midnight(endDate) <= midnight(d)) setEndDate(new Date(midnight(d).getTime() + DAY));
  };

  const handleContinue = async () => {
    if (pickupMethod === 'delivery' && !deliveryAddress.trim()) {
      Alert.alert('Where should we bring it?', 'Enter the delivery address.');
      return;
    }
    if (timeError) {
      Alert.alert('Choose another time', timeError);
      return;
    }
    if (rateType === 'day' && midnight(endDate) <= midnight(startDate)) {
      Alert.alert('Check your dates', 'The return date must be after the pick-up date.');
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

    onContinue({
      car: carData,
      pickupLocation: pickupMethod === 'vendor' ? carData.location || 'Vendor location' : deliveryAddress.trim(),
      deliveryAddress: pickupMethod === 'delivery' ? deliveryAddress.trim() : undefined,
      pickupMethod,
      rideMode: 'with-driver',
      startDate: formatDate(start),
      endDate: formatDate(end),
      startTime: formatTime(start),
      stopTime: formatTime(end),
      duration,
      durationType: rateType,
    });
  };

  const unit = rateType === 'day' ? 'day' : 'hour';

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
              <AppText variant="subheading">{naira(unitPrice)}</AppText>
              <AppText variant="small" color={color.muted}>
                per {unit}
              </AppText>
            </View>
          </Panel>

          {/* Rate */}
          <SectionTitle title="How long do you need it?" />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Chip label="By the day" active={rateType === 'day'} onPress={() => setRateType('day')} />
            {offersHourly ? (
              <Chip label="By the hour" active={rateType === 'hour'} onPress={() => setRateType('hour')} />
            ) : (
              <View style={styles.dailyOnly}>
                <AppText variant="small" color={color.muted}>
                  This car is daily only
                </AppText>
              </View>
            )}
          </View>

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
            {rateType === 'day' ? (
              <View style={styles.dtRow}>
                <DateTimeField
                  label="Date"
                  mode="date"
                  value={endDate}
                  display={shortDay(endDate)}
                  minimumDate={new Date(midnight(startDate).getTime() + DAY)}
                  onChange={setEndDate}
                />
                <View style={styles.dtFixed}>
                  <AppText variant="small" color={color.muted} style={{ fontSize: 12 }}>
                    Time
                  </AppText>
                  <AppText variant="bodyMedium" color={color.muted} style={{ marginTop: 2 }}>
                    {formatTime(startTime)}
                  </AppText>
                </View>
              </View>
            ) : (
              <View style={styles.dtRow}>
                <DateTimeField label="Time" mode="time" value={stopTime} display={formatTime(stopTime)} onChange={setStopTime} />
                <View style={styles.dtFixed}>
                  <AppText variant="small" color={color.muted} style={{ fontSize: 12 }}>
                    Date
                  </AppText>
                  <AppText variant="bodyMedium" color={color.muted} style={{ marginTop: 2 }}>
                    {shortDay(end)}
                  </AppText>
                </View>
              </View>
            )}

            <View style={styles.duration}>
              <Feather name="clock" size={15} color={color.primary} />
              <AppText variant="smallMedium" color={color.primary}>
                {duration} {unit}
                {duration > 1 ? 's' : ''} · {shortDay(start)} to {shortDay(end)}
              </AppText>
            </View>
          </Panel>

          {/* Pick-up */}
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

          {/* Driver */}
          <SectionTitle title="Driver" />
          <OptionCard icon="user-check" title="Professional driver included" subtitle="Every Escardia trip comes with a vetted driver." selected />
          <OptionCard
            icon="key"
            title="Self-drive"
            subtitle="Coming soon"
            selected={false}
            disabled
            right={
              <View style={styles.soon}>
                <AppText variant="smallMedium" color={color.muted} style={{ fontSize: 11 }}>
                  Soon
                </AppText>
              </View>
            }
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomBar
        label="Car rental"
        amount={naira(rental)}
        note={`${duration} ${unit}${duration > 1 ? 's' : ''}`}
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
  soon: { paddingHorizontal: 8, height: 22, borderRadius: 11, backgroundColor: color.sunken, justifyContent: 'center' },
}));

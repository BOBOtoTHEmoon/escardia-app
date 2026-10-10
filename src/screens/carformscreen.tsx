// Add a car / Edit a car: one form for both.
// Photos, make and model, prices (with the vendor's take-home shown live), details and location.
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../config/supabase';
import { addCar, getVendorCarById, updateCar, Car } from '../services/carservice';
import { getVendorStatus } from '../services/vendorService';
import { CAR_BRANDS, getModelsForBrand } from '../data/carData';
import { CAR_TYPES, FUEL_TYPES, LAGOS_AREAS, TRANSMISSIONS } from '../data/carTypes';
import { useAppSettings } from '../hooks/useAppSettings';
import { AppText, Banner, Button, Screen, ScreenHeader, TextField } from '../ui';
import { BottomBar, Stepper } from '../ui/Booking';
import { naira } from '../ui/CarCard';
import { BottomSheet, ChoiceChips, EmptyState, PhotoSourceSheet, SearchPicker, pickImage } from '../ui/Kit';
import { MenuGroup, MenuRow } from '../ui/Menu';
import { brand as brandColor, color, font, gutter, radius, themed, statusBarStyle, isDark } from '../theme';

const MAX_PHOTOS = 8;
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: THIS_YEAR + 1 - 2005 + 1 }, (_, i) => String(THIS_YEAR + 1 - i));

interface CarFormScreenProps {
  /** Leave out to add a new car. */
  carId?: string;
  onNavigateBack: () => void;
  onDone: () => void;
}

type Errors = Partial<Record<'photos' | 'brand' | 'model' | 'year' | 'type' | 'pricePerDay' | 'location', string>>;

const digits = (v: string) => v.replace(/\D/g, '').slice(0, 9);
const withCommas = (v: string) => (v ? Number(v).toLocaleString('en-NG') : '');

export const CarFormScreen: React.FC<CarFormScreenProps> = ({ carId, onNavigateBack, onDone }) => {
  const editing = !!carId;
  const insets = useSafeAreaInsets();
  const { settings } = useAppSettings();

  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [original, setOriginal] = useState<Car | null>(null);

  const [photos, setPhotos] = useState<string[]>([]);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [type, setType] = useState<string | null>(null);
  const [pricePerDay, setPricePerDay] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [seats, setSeats] = useState(5);
  const [doors, setDoors] = useState(4);
  const [transmission, setTransmission] = useState<string>('Automatic');
  const [fuel, setFuel] = useState<string>('Petrol');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [photoSheet, setPhotoSheet] = useState(false);
  const [photoMenu, setPhotoMenu] = useState<number | null>(null);
  const [picker, setPicker] = useState<'brand' | 'model' | 'year' | null>(null);

  useEffect(() => {
    (async () => {
      const st = await getVendorStatus();
      if (st && (st.status === 'rejected' || st.status === 'suspended')) {
        setBlocked(
          st.status === 'rejected'
            ? 'Your vendor application was not approved, so you cannot list cars. Contact support to find out what to change.'
            : 'Your vendor account is suspended, so you cannot change your cars. Contact support for help.'
        );
        return setReady(true);
      }
      if (carId) {
        const r = await getVendorCarById(carId, auth.currentUser?.uid ?? '');
        if (r.success && r.car) {
          const c = r.car;
          setOriginal(c);
          setPhotos(c.photos ?? []);
          setBrand(c.brand);
          setModel(c.model);
          setYear(String(c.year ?? ''));
          setType(CAR_TYPES.find((t) => t.toLowerCase() === (c.type ?? '').toLowerCase()) ?? null);
          setPricePerDay(c.pricePerDay ? String(Math.round(c.pricePerDay)) : '');
          setPricePerHour(c.pricePerHour ? String(Math.round(c.pricePerHour)) : '');
          setSeats(c.seats || 5);
          setDoors(c.doors || 4);
          setTransmission(TRANSMISSIONS.find((t) => t.toLowerCase() === (c.transmission ?? '').toLowerCase()) ?? 'Automatic');
          setFuel(FUEL_TYPES.find((t) => t.toLowerCase() === (c.fuelType ?? '').toLowerCase()) ?? 'Petrol');
          setLocation(c.location ?? '');
          setDescription(c.description ?? '');
        } else setBlocked('We could not find this car. It may have been removed.');
      }
      setReady(true);
    })();
  }, [carId]);

  const clear = (k: keyof Errors) => errors[k] && setErrors({ ...errors, [k]: undefined });

  const day = Number(pricePerDay || 0);
  const takeHome = Math.round(day * (1 - settings.commissionRate));
  const commissionPct = `${Math.round(settings.commissionRate * 1000) / 10}%`;

  /** Changing these on an approved car sends it back for review (database rule). */
  const needsReview = useMemo(() => {
    if (!original || original.approvalStatus !== 'approved') return false;
    return (
      brand !== original.brand ||
      model !== original.model ||
      year !== String(original.year ?? '') ||
      photos.length !== original.photos.length ||
      photos.some((p, i) => p !== original.photos[i])
    );
  }, [original, brand, model, year, photos]);

  const addPhotos = async (source: 'camera' | 'library') => {
    const room = MAX_PHOTOS - photos.length;
    const picked = await pickImage(source, { aspect: [16, 10], quality: 0.7, multiple: room });
    setPhotoSheet(false);
    if (picked?.length) {
      setPhotos((p) => [...p, ...picked].slice(0, MAX_PHOTOS));
      clear('photos');
    }
  };

  const submit = async () => {
    const next: Errors = {};
    if (!photos.length) next.photos = 'Add at least one photo. Three or more works best.';
    if (!brand.trim()) next.brand = 'Choose the make';
    if (!model.trim()) next.model = 'Choose the model';
    if (!year) next.year = 'Choose the year';
    if (!type) next.type = 'Choose a type';
    if (!day) next.pricePerDay = 'Set a daily price';
    else if (day < 1000) next.pricePerDay = 'That price looks too low';
    if (!location.trim()) next.location = 'Where do customers pick the car up?';
    setErrors(next);
    if (Object.keys(next).length) return Alert.alert('A few things are missing', 'Check the fields marked in red.');

    const data = {
      brand: brand.trim(),
      model: model.trim(),
      year,
      type: type!.toLowerCase(),
      pricePerDay: day,
      pricePerHour: Number(pricePerHour || 0),
      seats,
      doors,
      transmission: transmission.toLowerCase(),
      fuelType: fuel.toLowerCase(),
      location: location.trim(),
      description: description.trim(),
      photos,
    };

    setSaving(true);
    const r = editing ? await updateCar(carId!, data) : await addCar(data, auth.currentUser?.uid ?? '');
    setSaving(false);
    if (!r.success) return Alert.alert(editing ? 'Could not save' : 'Could not add the car', r.error || 'Please try again.');
    if (editing && !needsReview) return onDone();
    setSaved(true);
  };

  if (!ready) {
    return (
      <Screen>
        <ScreenHeader title={editing ? 'Edit car' : 'Add a car'} onBack={onNavigateBack} />
        <View style={styles.center}>
          <ActivityIndicator color={color.primary} />
        </View>
      </Screen>
    );
  }

  if (blocked) {
    return (
      <Screen>
        <StatusBar style={statusBarStyle()} />
        <ScreenHeader title={editing ? 'Edit car' : 'Add a car'} onBack={onNavigateBack} />
        <EmptyState icon="lock" title="Not available" body={blocked} action={<Button title="Go back" size="md" variant="secondary" onPress={onNavigateBack} />} />
      </Screen>
    );
  }

  if (saved) {
    return (
      <Screen>
        <StatusBar style={statusBarStyle()} />
        <View style={[styles.center, { paddingHorizontal: 32 }]}>
          <View style={styles.doneRing}>
            <View style={styles.doneCircle}>
              <Feather name="check" size={30} color="#FFFFFF" />
            </View>
          </View>
          <AppText variant="title" center style={{ marginTop: 20 }}>
            {editing ? 'Changes sent for review' : 'Car sent for review'}
          </AppText>
          <AppText variant="body" color={color.muted} center style={{ marginTop: 6 }}>
            Escardia checks the photos and details before {brand} {model} {editing ? 'goes live again' : 'goes live'}. We will notify you as soon as it is approved.
          </AppText>
          <Button title={editing ? 'Back to car' : 'Go to my fleet'} onPress={onDone} style={{ alignSelf: 'stretch', marginTop: 28 }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <StatusBar style={statusBarStyle()} />
      <ScreenHeader title={editing ? 'Edit car' : 'Add a car'} subtitle={editing ? `${original?.brand} ${original?.model}` : 'Escardia reviews every car before it goes live'} onBack={onNavigateBack} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 140 + insets.bottom }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {needsReview && <Banner tone="info" text="You changed the make, model, year or photos, so this car will be hidden until Escardia approves the change." />}
          {original?.approvalStatus === 'rejected' && !!original.rejectionReason && <Banner text={`Escardia asked for changes: ${original.rejectionReason}`} />}

          {/* Photos */}
          <Section title="Photos" hint={`Up to ${MAX_PHOTOS}. The first photo is the cover customers see first.`} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 4 }}>
            {photos.map((p, i) => (
              <Pressable key={p + i} onPress={() => setPhotoMenu(i)} style={styles.photo} accessibilityLabel={`Photo ${i + 1}`}>
                <Image source={{ uri: p }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                {i === 0 && (
                  <View style={styles.cover}>
                    <AppText variant="smallMedium" color="#FFFFFF" style={{ fontSize: 11 }}>
                      Cover
                    </AppText>
                  </View>
                )}
                <View style={styles.photoMore}>
                  <Feather name="more-horizontal" size={14} color="#FFFFFF" />
                </View>
              </Pressable>
            ))}
            {photos.length < MAX_PHOTOS && (
              <Pressable onPress={() => setPhotoSheet(true)} style={[styles.photo, styles.addPhoto, !!errors.photos && { borderColor: color.danger }]} accessibilityLabel="Add photos">
                <Feather name="camera" size={20} color={color.primary} />
                <AppText variant="smallMedium" color={color.primary} style={{ marginTop: 6 }}>
                  Add photos
                </AppText>
                <AppText variant="small" color={color.muted} style={{ fontSize: 11 }}>
                  {photos.length}/{MAX_PHOTOS}
                </AppText>
              </Pressable>
            )}
          </ScrollView>
          {!!errors.photos && <FieldError text={errors.photos} />}
          <AppText variant="small" color={color.muted} style={{ marginTop: 8 }}>
            Tip: shoot in daylight from the front corner, the side, the back and the inside.
          </AppText>

          {/* The car */}
          <Section title="The car" />
          <PickField label="Make" value={brand} placeholder="Choose the make" error={errors.brand} onPress={() => setPicker('brand')} />
          <PickField label="Model" value={model} placeholder={brand ? 'Choose the model' : 'Choose the make first'} error={errors.model} onPress={() => (brand ? setPicker('model') : setPicker('brand'))} />
          <PickField label="Year" value={year} placeholder="Choose the year" error={errors.year} onPress={() => setPicker('year')} />
          <AppText variant="smallMedium" color={color.text} style={{ marginBottom: 8 }}>
            Type
          </AppText>
          <ChoiceChips
            options={CAR_TYPES.map((t) => ({ key: t as string, label: t }))}
            value={type}
            onChange={(t) => {
              setType(t);
              clear('type');
            }}
          />
          {!!errors.type && <FieldError text={errors.type} />}

          {/* Prices */}
          <Section title="Prices" hint="Customers pay Escardia's service fee and any security on top of your price." />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <MoneyField
              label="Per day"
              value={pricePerDay}
              onChange={(v) => {
                setPricePerDay(v);
                clear('pricePerDay');
              }}
              error={errors.pricePerDay}
            />
            <MoneyField label="Per hour" optional value={pricePerHour} onChange={setPricePerHour} />
          </View>
          <View style={styles.takeHome}>
            <Feather name="trending-up" size={16} color={color.success} />
            <AppText variant="small" color={color.text} style={{ flex: 1 }}>
              {day ? (
                <>
                  You receive <AppText variant="smallMedium" color={color.success}>{naira(takeHome)}</AppText> per day after Escardia&apos;s {commissionPct} commission.
                </>
              ) : (
                `Escardia keeps a ${commissionPct} commission. Leave the hourly price empty if you only rent by the day.`
              )}
            </AppText>
          </View>

          {/* Details */}
          <Section title="Details" />
          <View style={styles.stepRow}>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyMedium">Seats</AppText>
              <AppText variant="small" color={color.muted}>
                Including the driver
              </AppText>
            </View>
            <Stepper value={seats} onChange={setSeats} min={2} max={18} />
          </View>
          <View style={[styles.stepRow, { marginBottom: 16 }]}>
            <AppText variant="bodyMedium" style={{ flex: 1 }}>
              Doors
            </AppText>
            <Stepper value={doors} onChange={setDoors} min={2} max={5} />
          </View>
          <AppText variant="smallMedium" color={color.text} style={{ marginBottom: 8 }}>
            Gearbox
          </AppText>
          <ChoiceChips options={TRANSMISSIONS.map((t) => ({ key: t as string, label: t }))} value={transmission} onChange={setTransmission} style={{ marginBottom: 16 }} />
          <AppText variant="smallMedium" color={color.text} style={{ marginBottom: 8 }}>
            Fuel
          </AppText>
          <ChoiceChips options={FUEL_TYPES.map((t) => ({ key: t as string, label: t }))} value={fuel} onChange={setFuel} />

          {/* Location */}
          <Section title="Pick-up location" hint="The area customers collect the car from. Shown on their trip map." />
          <TextField
            icon="map-pin"
            placeholder="For example, Lekki Phase 1"
            value={location}
            onChangeText={(v) => {
              setLocation(v);
              clear('location');
            }}
            autoCapitalize="words"
            error={errors.location}
            containerStyle={{ marginBottom: 10 }}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} keyboardShouldPersistTaps="handled">
            {LAGOS_AREAS.map((a) => {
              const on = location.trim().toLowerCase() === a.toLowerCase();
              return (
                <Pressable
                  key={a}
                  onPress={() => {
                    setLocation(a);
                    clear('location');
                  }}
                  style={[styles.area, on && styles.areaOn]}
                >
                  <AppText variant="smallMedium" color={on ? '#FFFFFF' : color.text} style={{ fontSize: 13 }}>
                    {a}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Description */}
          <Section title="Description" hint="Optional. What makes this car special?" />
          <View style={styles.textarea}>
            <TextInput
              keyboardAppearance={isDark() ? 'dark' : 'light'}
              value={description}
              onChangeText={(t) => setDescription(t.slice(0, 600))}
              placeholder="Clean interior, chilled AC, Apple CarPlay, tinted windows…"
              placeholderTextColor={color.subtle}
              multiline
              style={styles.textareaInput}
            />
            <AppText variant="small" color={color.subtle} style={{ alignSelf: 'flex-end', fontSize: 11 }}>
              {description.length}/600
            </AppText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomBar
        button={
          <Button
            title={saving ? (photos.some((p) => !/^https?:/i.test(p)) ? 'Uploading photos' : 'Saving') : editing ? 'Save changes' : 'Submit for review'}
            icon={editing ? 'check' : 'send'}
            onPress={submit}
            loading={saving}
          />
        }
      />

      <PhotoSourceSheet visible={photoSheet} title="Add photos" subtitle="Clear, bright photos get more bookings." onClose={() => setPhotoSheet(false)} onPick={addPhotos} />

      <BottomSheet visible={photoMenu !== null} onClose={() => setPhotoMenu(null)} title={photoMenu === 0 ? 'Cover photo' : `Photo ${(photoMenu ?? 0) + 1}`}>
        <MenuGroup>
          {photoMenu !== 0 && (
            <MenuRow
              icon="star"
              label="Make this the cover"
              onPress={() => {
                const i = photoMenu!;
                setPhotos((p) => [p[i], ...p.filter((_, j) => j !== i)]);
                setPhotoMenu(null);
              }}
            />
          )}
          <MenuRow
            icon="trash-2"
            label="Remove photo"
            danger
            right={<View />}
            last
            onPress={() => {
              const i = photoMenu!;
              setPhotos((p) => p.filter((_, j) => j !== i));
              setPhotoMenu(null);
            }}
          />
        </MenuGroup>
        <Button title="Cancel" variant="secondary" onPress={() => setPhotoMenu(null)} style={{ marginTop: 14 }} />
      </BottomSheet>

      <SearchPicker
        visible={picker === 'brand'}
        title="Make"
        options={CAR_BRANDS}
        value={brand}
        allowCustom
        onClose={() => setPicker(null)}
        onSelect={(v) => {
          if (v !== brand) setModel('');
          setBrand(v);
          clear('brand');
          setPicker(null);
        }}
      />
      <SearchPicker
        visible={picker === 'model'}
        title={`${brand} model`}
        options={getModelsForBrand(brand)}
        value={model}
        allowCustom
        onClose={() => setPicker(null)}
        onSelect={(v) => {
          setModel(v);
          clear('model');
          setPicker(null);
        }}
      />
      <SearchPicker
        visible={picker === 'year'}
        title="Year"
        options={YEARS}
        value={year}
        onClose={() => setPicker(null)}
        onSelect={(v) => {
          setYear(v);
          clear('year');
          setPicker(null);
        }}
      />
    </Screen>
  );
};

/* ------------------------------------------------------------------ */

const Section = ({ title, hint }: { title: string; hint?: string }) => (
  <View style={{ marginTop: 26, marginBottom: 12 }}>
    <AppText variant="heading">{title}</AppText>
    {!!hint && (
      <AppText variant="small" color={color.muted} style={{ marginTop: 2 }}>
        {hint}
      </AppText>
    )}
  </View>
);

const FieldError = ({ text }: { text: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
    <Feather name="alert-circle" size={13} color={color.danger} />
    <AppText variant="small" color={color.danger}>
      {text}
    </AppText>
  </View>
);

const PickField = ({ label, value, placeholder, error, onPress }: { label: string; value: string; placeholder: string; error?: string; onPress: () => void }) => (
  <View style={{ marginBottom: 16 }}>
    <AppText variant="smallMedium" color={color.text} style={{ marginBottom: 6 }}>
      {label}
    </AppText>
    <Pressable onPress={onPress} style={[styles.pick, !!error && { borderColor: color.danger }]} accessibilityRole="button" accessibilityLabel={`${label}: ${value || placeholder}`}>
      <AppText variant="body" color={value ? color.ink : color.subtle} style={{ flex: 1 }} numberOfLines={1}>
        {value || placeholder}
      </AppText>
      <Feather name="chevron-down" size={18} color={color.subtle} />
    </Pressable>
    {!!error && <FieldError text={error} />}
  </View>
);

const MoneyField = ({ label, value, onChange, optional, error }: { label: string; value: string; onChange: (v: string) => void; optional?: boolean; error?: string }) => (
  <View style={{ flex: 1 }}>
    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
      <AppText variant="smallMedium" color={color.text}>
        {label}
      </AppText>
      {optional && (
        <AppText variant="small" color={color.subtle}>
          Optional
        </AppText>
      )}
    </View>
    <View style={[styles.money, !!error && { borderColor: color.danger }]}>
      <AppText variant="bodyMedium" color={value ? color.ink : color.subtle}>
        ₦
      </AppText>
      <TextInput
        keyboardAppearance={isDark() ? 'dark' : 'light'}
        value={withCommas(value)}
        onChangeText={(t) => onChange(digits(t))}
        placeholder="0"
        placeholderTextColor={color.subtle}
        keyboardType="number-pad"
        style={styles.moneyInput}
        accessibilityLabel={`Price ${label.toLowerCase()}`}
      />
    </View>
    {!!error && <FieldError text={error} />}
  </View>
);

const PHOTO = 112;

const styles = themed(() => StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  photo: { width: PHOTO * 1.35, height: PHOTO, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: color.sunken },
  addPhoto: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderStyle: 'dashed', borderColor: color.primaryLine, backgroundColor: color.primarySoft },
  cover: { position: 'absolute', left: 8, top: 8, paddingHorizontal: 8, height: 22, borderRadius: 11, backgroundColor: color.primary, justifyContent: 'center' },
  photoMore: { position: 'absolute', right: 8, top: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(11,21,48,0.6)', alignItems: 'center', justifyContent: 'center' },
  pick: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  money: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 52,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  moneyInput: { flex: 1, minWidth: 0, fontFamily: font.semibold, fontSize: 16, color: color.ink, paddingVertical: 0 },
  takeHome: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, padding: 12, borderRadius: radius.md, backgroundColor: color.successSoft },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 10, borderRadius: radius.lg, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border },
  area: { paddingHorizontal: 12, height: 34, borderRadius: 17, justifyContent: 'center', backgroundColor: color.surface, borderWidth: 1, borderColor: color.border },
  areaOn: { backgroundColor: color.primary, borderColor: color.primary },
  textarea: { minHeight: 120, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: color.border, backgroundColor: color.surface },
  textareaInput: { flex: 1, minHeight: 80, fontFamily: font.regular, fontSize: 15, color: color.ink, textAlignVertical: 'top', padding: 0 },
  doneRing: { width: 92, height: 92, borderRadius: 46, backgroundColor: color.successSoft, alignItems: 'center', justifyContent: 'center' },
  doneCircle: { width: 66, height: 66, borderRadius: 33, backgroundColor: color.success, alignItems: 'center', justifyContent: 'center' },
}));


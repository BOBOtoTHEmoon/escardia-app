import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFavorites } from '../hooks/useFavorites';
import ratingService, { SavedRating } from '../services/ratingservice';
import { AppText, Button, IconButton, IconName } from '../ui';
import { Heart, naira } from '../ui/CarCard';
import { color, gutter, radius, shadow, themed, statusBarStyle } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_HEIGHT = Math.round(SCREEN_WIDTH * 0.85);

interface CarDetailsScreenProps {
  carId: string;
  onNavigateBack: () => void;
  onNavigateToTripDetails: (carData: any) => void;
}

export const CarDetailsScreen: React.FC<CarDetailsScreenProps> = ({ carId, onNavigateBack, onNavigateToTripDetails }) => {
  const insets = useSafeAreaInsets();
  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [photoIndex, setPhotoIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [reviews, setReviews] = useState<SavedRating[]>([]);
  const { isFavorite, toggle } = useFavorites();

  useEffect(() => {
    (async () => {
      const { getCar } = await import('../services/carservice');
      const result = await getCar(carId);
      if (result.success && result.car) {
        setCar(result.car);
        ratingService
          .getCarRatings(carId)
          .then((r) => setReviews(r.reviews.filter((x) => x.review).slice(0, 3)))
          .catch(() => {});
      } else {
        setError(result.error || 'This car is no longer available');
      }
      setLoading(false);
    })();
  }, [carId]);

  if (loading) {
    return (
      <View style={[styles.root, styles.center]}>
        <StatusBar style={statusBarStyle()} />
        <ActivityIndicator color={color.primary} />
      </View>
    );
  }

  if (!car) {
    return (
      <View style={[styles.root, styles.center, { paddingHorizontal: 32 }]}>
        <StatusBar style={statusBarStyle()} />
        <View style={styles.errorIcon}>
          <Feather name="alert-circle" size={24} color={color.muted} />
        </View>
        <AppText variant="heading" center style={{ marginTop: 16 }}>
          Car unavailable
        </AppText>
        <AppText variant="body" color={color.muted} center style={{ marginTop: 6, marginBottom: 24 }}>
          {error}
        </AppText>
        <Button title="Go back" variant="secondary" onPress={onNavigateBack} style={{ alignSelf: 'stretch' }} />
      </View>
    );
  }

  const photos: string[] = car.photos ?? [];
  const reviewCount = car.rating?.totalReviews ?? 0;
  const specs: { icon: IconName; label: string; value: string }[] = [
    { icon: 'users', label: 'Seats', value: String(car.seats || '-') },
    { icon: 'columns', label: 'Doors', value: String(car.doors || '-') },
    { icon: 'settings', label: 'Gearbox', value: car.transmission || '-' },
    { icon: 'droplet', label: 'Fuel', value: car.fuelType || '-' },
  ];
  const description: string = car.description || '';

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 + insets.bottom }} bounces={false}>
        {/* Photos */}
        <View style={{ height: PHOTO_HEIGHT, backgroundColor: color.navy }}>
          {photos.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))}
            >
              {photos.map((uri) => (
                <Image key={uri} source={{ uri }} style={{ width: SCREEN_WIDTH, height: PHOTO_HEIGHT }} resizeMode="cover" />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.center, { flex: 1 }]}>
              <Feather name="image" size={36} color="rgba(255,255,255,0.3)" />
            </View>
          )}
          <View style={[styles.photoBar, { top: insets.top + 8 }]}>
            <IconButton icon="chevron-left" onPress={onNavigateBack} accessibilityLabel="Go back" style={styles.floatingBtn} />
            <View style={[styles.floatingBtn, styles.heartWrap]}>
              <Heart active={isFavorite(car.id)} onPress={() => toggle(car.id)} />
            </View>
          </View>
          {photos.length > 1 && (
            <View style={styles.counter}>
              <AppText variant="smallMedium" color="#FFFFFF" style={{ fontSize: 12 }}>
                {photoIndex + 1} / {photos.length}
              </AppText>
            </View>
          )}
        </View>

        {/* Details sheet */}
        <View style={styles.sheet}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <AppText variant="small" color={color.muted}>
                {[car.year, car.type && car.type.length <= 3 ? car.type.toUpperCase() : car.type?.replace(/^./, (c: string) => c.toUpperCase())].filter(Boolean).join(' · ')}
              </AppText>
              <AppText variant="title" style={{ marginTop: 2 }}>
                {car.brand} {car.model}
              </AppText>
            </View>
            <View style={styles.ratingBox}>
              {reviewCount > 0 ? (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Feather name="star" size={14} color="#F59E0B" />
                    <AppText variant="subheading">{Number(car.rating.averageOverall).toFixed(1)}</AppText>
                  </View>
                  <AppText variant="small" color={color.muted} style={{ fontSize: 11 }}>
                    {reviewCount} review{reviewCount === 1 ? '' : 's'}
                  </AppText>
                </>
              ) : (
                <AppText variant="smallMedium" color={color.primary}>
                  New
                </AppText>
              )}
            </View>
          </View>

          {!!car.location && (
            <View style={styles.inline}>
              <Feather name="map-pin" size={14} color={color.muted} />
              <AppText variant="small" color={color.text}>
                {car.location}
              </AppText>
            </View>
          )}

          {/* Vendor */}
          <View style={styles.vendor}>
            <View style={styles.vendorAvatar}>
              <AppText variant="subheading" color={color.primary}>
                {(car.vendorName?.[0] ?? 'E').toUpperCase()}
              </AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="small" color={color.muted}>
                Listed by
              </AppText>
              <AppText variant="bodyMedium" numberOfLines={1}>
                {car.vendorName || 'Escardia vendor'}
              </AppText>
            </View>
            <View style={styles.verified}>
              <Feather name="check-circle" size={12} color={color.success} />
              <AppText variant="smallMedium" color={color.success} style={{ fontSize: 12 }}>
                Verified
              </AppText>
            </View>
          </View>

          {/* Specs */}
          <View style={styles.specs}>
            {specs.map((s) => (
              <View key={s.label} style={styles.spec}>
                <View style={styles.specIcon}>
                  <Feather name={s.icon} size={16} color={color.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="small" color={color.muted} style={{ fontSize: 12 }}>
                    {s.label}
                  </AppText>
                  <AppText variant="smallMedium" numberOfLines={1} style={{ textTransform: 'capitalize' }}>
                    {s.value}
                  </AppText>
                </View>
              </View>
            ))}
          </View>

          {!!description && (
            <View style={{ marginTop: 24 }}>
              <AppText variant="heading" style={{ marginBottom: 8 }}>
                About this car
              </AppText>
              <AppText variant="body" color={color.text} numberOfLines={expanded ? undefined : 4}>
                {description}
              </AppText>
              {description.length > 160 && (
                <Pressable onPress={() => setExpanded(!expanded)} hitSlop={8} style={{ marginTop: 6 }}>
                  <AppText variant="smallMedium" color={color.primary}>
                    {expanded ? 'Show less' : 'Read more'}
                  </AppText>
                </Pressable>
              )}
            </View>
          )}

          {/* Pricing */}
          <View style={{ marginTop: 24 }}>
            <AppText variant="heading" style={{ marginBottom: 10 }}>
              Pricing
            </AppText>
            <View style={styles.priceRow}>
              <PriceTile label="Per day" value={naira(car.pricePerDay)} />
              {car.pricePerHour > 0 && <PriceTile label="Per hour" value={naira(car.pricePerHour)} />}
            </View>
            <View style={[styles.inline, { marginTop: 12 }]}>
              <Feather name="info" size={13} color={color.muted} />
              <AppText variant="small" color={color.muted} style={{ flex: 1 }}>
                Delivery, security and the service fee are added when you book.
              </AppText>
            </View>
          </View>

          {/* Reviews */}
          {reviews.length > 0 && (
            <View style={{ marginTop: 24 }}>
              <AppText variant="heading" style={{ marginBottom: 10 }}>
                What riders say
              </AppText>
              {reviews.map((r) => (
                <View key={r.id} style={styles.review}>
                  <View style={{ flexDirection: 'row', gap: 2, marginBottom: 6 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Feather key={i} name="star" size={12} color={i < Math.round(r.overallExperience) ? '#F59E0B' : color.border} />
                    ))}
                  </View>
                  <AppText variant="body" color={color.text}>
                    {r.review}
                  </AppText>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Book bar */}
      <View style={[styles.bookBar, shadow.lg, { paddingBottom: insets.bottom + 12 }]}>
        <View>
          <AppText variant="heading">{naira(car.pricePerDay)}</AppText>
          <AppText variant="small" color={color.muted}>
            per day
          </AppText>
        </View>
        <Button title="Book now" iconRight="arrow-right" onPress={() => onNavigateToTripDetails(car)} style={{ flex: 1, marginLeft: 20 }} />
      </View>
    </View>
  );
};

const PriceTile = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.priceTile}>
    <AppText variant="small" color={color.muted}>
      {label}
    </AppText>
    <AppText variant="heading" style={{ marginTop: 4 }}>
      {value}
    </AppText>
  </View>
);

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  errorIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: color.sunken, alignItems: 'center', justifyContent: 'center' },
  photoBar: { position: 'absolute', left: gutter, right: gutter, flexDirection: 'row', justifyContent: 'space-between' },
  floatingBtn: { borderWidth: 0, ...shadow.md },
  heartWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' },
  counter: {
    position: 'absolute',
    right: gutter,
    bottom: 40,
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(15,23,42,0.6)',
    justifyContent: 'center',
  },
  sheet: {
    marginTop: -24,
    backgroundColor: color.bg,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: gutter,
    paddingTop: 24,
  },
  ratingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  vendor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  vendorAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: color.primarySoft, alignItems: 'center', justifyContent: 'center' },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, height: 26, borderRadius: 13, backgroundColor: color.successSoft },
  specs: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  spec: {
    width: (SCREEN_WIDTH - gutter * 2 - 10) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  specIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: color.primarySoft, alignItems: 'center', justifyContent: 'center' },
  priceRow: { flexDirection: 'row', gap: 10 },
  priceTile: { flex: 1, padding: 14, borderRadius: radius.lg, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border },
  review: { padding: 14, borderRadius: radius.lg, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border, marginBottom: 10 },
  bookBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: gutter,
    paddingTop: 14,
    backgroundColor: color.surface,
    borderTopWidth: 1,
    borderTopColor: color.border,
  },
}));

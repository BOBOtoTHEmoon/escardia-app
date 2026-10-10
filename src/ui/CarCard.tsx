// Car cards used on Home, Cars and Favourites.
// The heart and rating badge sit on white over the photo in both themes, so they use fixed dark colours.
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { AppText } from './index';
import { brand, color, radius, shadow, slate, themed } from '../theme';

export const naira = (n: number | null | undefined) => `₦${Number(n ?? 0).toLocaleString('en-NG')}`;

export interface CarLike {
  id: string;
  brand?: string;
  model?: string;
  year?: string | number;
  type?: string;
  seats?: number;
  transmission?: string;
  location?: string;
  pricePerDay?: number;
  photos?: string[];
  rating?: { averageOverall?: number; totalReviews?: number };
  vendorName?: string;
}

export const RatingPill = ({ car, light }: { car: CarLike; light?: boolean }) => {
  const count = car.rating?.totalReviews ?? 0;
  const avg = car.rating?.averageOverall ?? 0;
  return (
    <View style={[styles.ratingPill, light && styles.ratingPillLight]}>
      {count > 0 ? (
        <>
          <Feather name="star" size={11} color="#F59E0B" />
          <AppText variant="smallMedium" style={{ fontSize: 12 }} color={light ? slate[900] : color.ink}>
            {avg.toFixed(1)}
          </AppText>
        </>
      ) : (
        <AppText variant="smallMedium" style={{ fontSize: 11 }} color={light ? brand[600] : color.primary}>
          New
        </AppText>
      )}
    </View>
  );
};

const Photo = ({ uri, style }: { uri?: string; style: object }) =>
  uri ? (
    <Image source={{ uri }} style={style} resizeMode="cover" />
  ) : (
    <View style={[style, { alignItems: 'center', justifyContent: 'center' }]}>
      <Feather name="image" size={26} color={color.borderStrong} />
    </View>
  );

export const Heart = ({ active, onPress }: { active: boolean; onPress: () => void }) => (
  <Pressable onPress={onPress} hitSlop={8} style={styles.heart} accessibilityLabel={active ? 'Remove from favourites' : 'Save to favourites'}>
    <Ionicons name={active ? 'heart' : 'heart-outline'} size={18} color={active ? '#EF4444' : slate[900]} />
  </Pressable>
);

/** Half-width card for 2-column grids. */
export const CarGridCard = ({
  car,
  favorite,
  onPress,
  onToggleFavorite,
  width,
}: {
  car: CarLike;
  favorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
  width: number;
}) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.gridCard, shadow.sm, { width }, pressed && styles.pressed]}>
    <View>
      <Photo uri={car.photos?.[0]} style={[styles.gridPhoto, { height: width * 0.72 }]} />
      <View style={styles.photoTop}>
        <RatingPill car={car} light />
        <Heart active={favorite} onPress={onToggleFavorite} />
      </View>
    </View>
    <View style={{ padding: 12 }}>
      <AppText variant="small" color={color.muted} numberOfLines={1}>
        {car.brand}
      </AppText>
      <AppText variant="subheading" numberOfLines={1} style={{ fontSize: 15 }}>
        {car.model}
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 8 }}>
        <AppText variant="subheading" color={color.primary} style={{ fontSize: 15 }}>
          {naira(car.pricePerDay)}
        </AppText>
        <AppText variant="small" color={color.muted}>
          {' '}
          /day
        </AppText>
      </View>
    </View>
  </Pressable>
);

/** Full-width card with the photo on top, for lists. */
export const CarListCard = ({
  car,
  favorite,
  onPress,
  onToggleFavorite,
}: {
  car: CarLike;
  favorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.listCard, shadow.sm, pressed && styles.pressed]}>
    <View>
      <Photo uri={car.photos?.[0]} style={styles.listPhoto} />
      <View style={styles.photoTop}>
        <RatingPill car={car} light />
        <Heart active={favorite} onPress={onToggleFavorite} />
      </View>
      {(car.photos?.length ?? 0) > 1 && (
        <View style={styles.photoCount}>
          <Feather name="image" size={11} color="#FFFFFF" />
          <AppText variant="smallMedium" color="#FFFFFF" style={{ fontSize: 11 }}>
            {car.photos!.length}
          </AppText>
        </View>
      )}
    </View>
    <View style={{ padding: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <AppText variant="subheading" numberOfLines={1}>
            {car.brand} {car.model}
          </AppText>
          <AppText variant="small" color={color.muted} numberOfLines={1} style={{ marginTop: 2 }}>
            {[car.year, car.vendorName].filter(Boolean).join(' · ')}
          </AppText>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <AppText variant="subheading" color={color.ink}>
            {naira(car.pricePerDay)}
          </AppText>
          <AppText variant="small" color={color.muted}>
            per day
          </AppText>
        </View>
      </View>
      <View style={styles.specs}>
        {!!car.seats && <Spec icon="users" label={`${car.seats} seats`} />}
        {!!car.transmission && <Spec icon="settings" label={car.transmission} />}
        {!!car.location && <Spec icon="map-pin" label={car.location} />}
      </View>
    </View>
  </Pressable>
);

const Spec = ({ icon, label }: { icon: React.ComponentProps<typeof Feather>['name']; label: string }) => (
  <View style={styles.spec}>
    <Feather name={icon} size={12} color={color.muted} />
    <AppText variant="small" color={color.text} numberOfLines={1} style={{ fontSize: 12, textTransform: 'capitalize', maxWidth: 140 }}>
      {label}
    </AppText>
  </View>
);

const styles = themed(() => StyleSheet.create({
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.96 },
  gridCard: { backgroundColor: color.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: color.border, overflow: 'hidden' },
  gridPhoto: { width: '100%', backgroundColor: color.sunken },
  listCard: { backgroundColor: color.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: color.border, overflow: 'hidden', marginBottom: 16 },
  listPhoto: { width: '100%', height: 190, backgroundColor: color.sunken },
  photoTop: { position: 'absolute', top: 10, left: 10, right: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, height: 24, borderRadius: 12, backgroundColor: color.primarySoft },
  ratingPillLight: { backgroundColor: 'rgba(255,255,255,0.94)' },
  heart: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCount: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(15,23,42,0.6)',
  },
  specs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  spec: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, height: 26, borderRadius: 8, backgroundColor: color.sunken },
}));

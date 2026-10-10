import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, Image, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocationSelector } from '../components/locationselector';
import { Chip } from '../components/filtermodal';
import { saveUserLocation, loadUserLocation } from '../utils/locationStorage';
import { useFavorites } from '../hooks/useFavorites';
import { AppText, IconName } from '../ui';
import { Avatar } from '../ui/Avatar';
import { CarGridCard, CarLike } from '../ui/CarCard';
import { TabBar, TAB_BAR_SPACE, CustomerTab } from '../ui/TabBar';
import { brand, color, gutter, radius, shadow, themed } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - gutter * 2 - 12) / 2;
const PROMO_WIDTH = SCREEN_WIDTH - gutter * 2;

// What Escardia offers. No made-up discounts.
const PROMOS: { icon: IconName; eyebrow: string; title: string; body: string; colors: [string, string] }[] = [
  {
    icon: 'shield',
    eyebrow: 'Security',
    title: 'Ride with an escort',
    body: 'Add LEGION or PRIVATE security and a Hilux backup to any trip.',
    colors: [brand[700], brand[950]],
  },
  {
    icon: 'truck',
    eyebrow: 'Delivery',
    title: 'Brought to your door',
    body: 'Have the car delivered to your home, hotel or office.',
    colors: ['#1F2A44', '#0B1220'],
  },
  {
    icon: 'layers',
    eyebrow: 'Fleets',
    title: 'Moving with a team?',
    body: 'Book several cars for events, weddings and visits.',
    colors: [brand[600], brand[800]],
  },
];

interface HomeScreenProps {
  userName?: string;
  avatarUrl?: string | null;
  onNavigateToProfile: () => void;
  onNavigateToCarDetails: (carId: string) => void;
  /** Opens the Cars tab; 'search' focuses the search box, 'filters' opens filters. */
  onNavigateToCars: (focus?: 'search' | 'filters') => void;
  onNavigateToTrips: () => void;
  onNavigateToSearch?: () => void;
  onNavigateToNotifications?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ userName = 'there', avatarUrl, onNavigateToProfile, onNavigateToCarDetails, onNavigateToCars, onNavigateToTrips, onNavigateToNotifications }) => {
  const insets = useSafeAreaInsets();
  const [location, setLocation] = useState('Victoria Island, Lagos');
  const [showLocation, setShowLocation] = useState(false);
  const [cars, setCars] = useState<CarLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [promoIndex, setPromoIndex] = useState(0);
  const { isFavorite, toggle } = useFavorites();
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    const { getAvailableCars } = await import('../services/carservice');
    const result = await getAvailableCars();
    if (result.success && result.cars) setCars(result.cars as CarLike[]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
    loadUserLocation().then((saved) => saved && setLocation(saved.name));
    import('../services/notificationService').then(({ getUnreadNotificationCount }) => getUnreadNotificationCount().then(setUnread).catch(() => {}));
  }, [load]);

  // Brands that actually have cars listed
  const brands = useMemo(() => ['All', ...Array.from(new Set(cars.map((c) => c.brand).filter(Boolean) as string[])).sort()], [cars]);

  // Most booked first, then best rated
  const popular = useMemo(() => {
    const list = selectedBrand === 'All' ? cars : cars.filter((c) => c.brand?.toLowerCase() === selectedBrand.toLowerCase());
    return [...list]
      .sort((a: any, b: any) => (b.totalBookings ?? 0) - (a.totalBookings ?? 0) || (b.rating?.averageOverall ?? 0) - (a.rating?.averageOverall ?? 0))
      .slice(0, 10);
  }, [cars, selectedBrand]);

  const navigate = (tab: CustomerTab) => {
    if (tab === 'cars') onNavigateToCars();
    else if (tab === 'trips') onNavigateToTrips();
    else if (tab === 'profile') onNavigateToProfile();
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor="#FFFFFF"
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View style={styles.glow} />
          <View style={styles.headerRow}>
            <Pressable onPress={() => setShowLocation(true)} style={styles.locationBtn} hitSlop={6}>
              <View style={styles.locationIcon}>
                <Feather name="map-pin" size={14} color="#FFFFFF" />
              </View>
              <View style={{ flexShrink: 1 }}>
                <AppText variant="small" color={color.onDarkMuted} style={{ fontSize: 12 }}>
                  Your location
                </AppText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <AppText variant="smallMedium" color="#FFFFFF" numberOfLines={1} style={{ fontSize: 14, maxWidth: SCREEN_WIDTH - 220 }}>
                    {location}
                  </AppText>
                  <Feather name="chevron-down" size={14} color="#FFFFFF" />
                </View>
              </View>
            </Pressable>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {onNavigateToNotifications && (
                <Pressable onPress={onNavigateToNotifications} style={styles.bell} accessibilityLabel="Notifications">
                  <Feather name="bell" size={18} color="#FFFFFF" />
                  {unread > 0 && <View style={styles.bellDot} />}
                </Pressable>
              )}
              <Pressable onPress={onNavigateToProfile} accessibilityLabel="Your profile">
                <Avatar uri={avatarUrl} name={userName} size={42} />
              </Pressable>
            </View>
          </View>

          <AppText variant="small" color={color.onDarkMuted} style={{ marginTop: 26 }}>
            {greeting}, {userName}
          </AppText>
          <AppText variant="title" color="#FFFFFF" style={{ marginTop: 4 }}>
            Where are you headed?
          </AppText>
        </View>

        {/* Search */}
        <Pressable onPress={() => onNavigateToCars('search')} style={[styles.search, shadow.md]}>
          <Feather name="search" size={18} color={color.subtle} />
          <AppText variant="body" color={color.subtle} style={{ flex: 1 }}>
            Search cars, brands or models
          </AppText>
          <Pressable onPress={() => onNavigateToCars('filters')} style={styles.filterBtn} hitSlop={6} accessibilityLabel="Filters">
            <Feather name="sliders" size={16} color="#FFFFFF" />
          </Pressable>
        </Pressable>

        {/* Why Escardia */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={PROMO_WIDTH + 12}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: gutter, gap: 12 }}
          onMomentumScrollEnd={(e) => setPromoIndex(Math.round(e.nativeEvent.contentOffset.x / (PROMO_WIDTH + 12)))}
          style={{ marginTop: 24 }}
        >
          {PROMOS.map((p) => (
            <Pressable key={p.title} onPress={() => onNavigateToCars()}>
              <LinearGradient colors={p.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.promo}>
                <View style={styles.promoRing} />
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <View style={styles.promoEyebrow}>
                    <Feather name={p.icon} size={12} color="#FFFFFF" />
                    <AppText variant="caption" color="#FFFFFF">
                      {p.eyebrow}
                    </AppText>
                  </View>
                  <AppText variant="heading" color="#FFFFFF" style={{ marginTop: 12 }}>
                    {p.title}
                  </AppText>
                  <AppText variant="small" color={color.onDarkMuted} style={{ marginTop: 4 }}>
                    {p.body}
                  </AppText>
                  <View style={styles.promoCta}>
                    <AppText variant="smallMedium" color={color.navy}>
                      Explore cars
                    </AppText>
                    <Feather name="arrow-right" size={14} color={color.navy} />
                  </View>
                </View>
                <Image source={require('../../assets/images/promocar.png')} style={styles.promoCar} resizeMode="contain" />
              </LinearGradient>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.dots}>
          {PROMOS.map((_, i) => (
            <View key={i} style={[styles.dot, i === promoIndex && styles.dotActive]} />
          ))}
        </View>

        {/* Brands */}
        <SectionHeader title="Browse by brand" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: gutter, gap: 8 }}>
          {brands.map((b) => (
            <Chip key={b} label={b} active={selectedBrand === b} onPress={() => setSelectedBrand(b)} />
          ))}
        </ScrollView>

        {/* Popular */}
        <SectionHeader title="Popular right now" action="See all" onAction={() => onNavigateToCars()} />
        <View style={styles.grid}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <View key={i} style={[styles.skeleton, { width: CARD_WIDTH, height: CARD_WIDTH * 0.72 + 92 }]} />)
          ) : popular.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="search" size={22} color={color.subtle} />
              <AppText variant="bodyMedium" style={{ marginTop: 10 }}>
                No {selectedBrand === 'All' ? '' : `${selectedBrand} `}cars yet
              </AppText>
              <AppText variant="small" color={color.muted} center style={{ marginTop: 4 }}>
                New cars are added every week. Pull down to refresh.
              </AppText>
            </View>
          ) : (
            popular.map((car) => (
              <CarGridCard
                key={car.id}
                car={car}
                width={CARD_WIDTH}
                favorite={isFavorite(car.id)}
                onToggleFavorite={() => toggle(car.id)}
                onPress={() => onNavigateToCarDetails(car.id)}
              />
            ))
          )}
        </View>
      </ScrollView>

      <TabBar active="home" onNavigate={navigate} />

      <LocationSelector
        visible={showLocation}
        currentLocation={location}
        onClose={() => setShowLocation(false)}
        onSelectLocation={async (name, coords) => {
          setLocation(name);
          await saveUserLocation(name, coords);
        }}
      />
    </View>
  );
};

const SectionHeader = ({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) => (
  <View style={styles.sectionHeader}>
    <AppText variant="heading">{title}</AppText>
    {action && (
      <Pressable onPress={onAction} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        <AppText variant="smallMedium" color={color.primary} style={{ fontSize: 14 }}>
          {action}
        </AppText>
        <Feather name="chevron-right" size={16} color={color.primary} />
      </Pressable>
    )}
  </View>
);

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  header: {
    backgroundColor: color.navy,
    paddingHorizontal: gutter,
    paddingBottom: 56,
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: brand[600],
    opacity: 0.3,
    top: -140,
    right: -100,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  locationBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  locationIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bell: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: { position: 'absolute', top: 10, right: 11, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: color.navy },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: brand[600],
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: gutter,
    marginTop: -28,
    height: 56,
    paddingLeft: 16,
    paddingRight: 8,
    borderRadius: radius.lg,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  filterBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center' },
  promo: { width: PROMO_WIDTH, minHeight: 168, borderRadius: radius.xl, padding: 18, flexDirection: 'row', overflow: 'hidden' },
  promoRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 28,
    borderColor: 'rgba(255,255,255,0.05)',
    right: -70,
    top: -60,
  },
  promoEyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  promoCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 14,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF', // white on the coloured promo card in both themes
  },
  promoCar: { width: 120, height: 90, alignSelf: 'flex-end', marginRight: -18, marginBottom: -6 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: color.borderStrong },
  dotActive: { width: 18, backgroundColor: color.primary },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: gutter, marginTop: 28, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: gutter },
  skeleton: { borderRadius: radius.lg, backgroundColor: color.sunken },
  empty: { width: '100%', alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24, borderRadius: radius.xl, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border },
}));

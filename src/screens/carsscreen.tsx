import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FilterModal, FilterOptions, Chip } from '../components/filtermodal';
import { useFavorites } from '../hooks/useFavorites';
import { DEFAULT_FILTERS, applyCarFilters, countActiveFilters } from '../utils/carFilters';
import { AppText } from '../ui';
import { CarLike, CarListCard } from '../ui/CarCard';
import { TabBar, TAB_BAR_SPACE, CustomerTab } from '../ui/TabBar';
import { color, font, gutter, radius, themed, statusBarStyle, isDark } from '../theme';

type Sort = 'recommended' | 'rating' | 'price';

interface CarsScreenProps {
  onNavigateToCarDetails: (carId: string) => void;
  onNavigateToHome: () => void;
  onNavigateToProfile: () => void;
  onNavigateToTrips: () => void;
  /** Focus the search box or open filters straight away (from Home). */
  initialFocus?: 'search' | 'filters' | null;
}

export const CarsScreen: React.FC<CarsScreenProps> = ({ onNavigateToCarDetails, onNavigateToHome, onNavigateToProfile, onNavigateToTrips, initialFocus }) => {
  const insets = useSafeAreaInsets();
  const [cars, setCars] = useState<CarLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('recommended');
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(initialFocus === 'filters');
  const searchRef = useRef<TextInput>(null);
  const { isFavorite, toggle } = useFavorites();

  const load = useCallback(async () => {
    const { getAllCars } = await import('../services/carservice');
    const result = await getAllCars();
    if (result.success && result.cars) setCars(result.cars as CarLike[]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
    if (initialFocus === 'search') setTimeout(() => searchRef.current?.focus(), 350);
  }, [load, initialFocus]);

  const brands = useMemo(() => Array.from(new Set(cars.map((c) => c.brand).filter(Boolean) as string[])).sort(), [cars]);
  const activeCount = countActiveFilters(filters);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = applyCarFilters(cars, filters);
    if (q) {
      list = list.filter((c) => [c.brand, c.model, c.type, c.location, c.vendorName].some((v) => v?.toLowerCase().includes(q)));
    }
    if (sort === 'rating') list = [...list].sort((a, b) => (b.rating?.averageOverall ?? 0) - (a.rating?.averageOverall ?? 0));
    if (sort === 'price') list = [...list].sort((a, b) => (a.pricePerDay ?? 0) - (b.pricePerDay ?? 0));
    return list;
  }, [cars, filters, query, sort]);

  const navigate = (tab: CustomerTab) => {
    if (tab === 'home') onNavigateToHome();
    else if (tab === 'trips') onNavigateToTrips();
    else if (tab === 'profile') onNavigateToProfile();
  };

  const header = (
    <View>
      <AppText variant="title">Find your car</AppText>
      <AppText variant="body" color={color.muted} style={{ marginTop: 2 }}>
        {loading ? 'Loading cars…' : `${visible.length} of ${cars.length} car${cars.length === 1 ? '' : 's'} available`}
      </AppText>

      <View style={styles.searchRow}>
        <View style={styles.search}>
          <Feather name="search" size={18} color={color.subtle} />
          <TextInput
            keyboardAppearance={isDark() ? 'dark' : 'light'}
            ref={searchRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Search cars, brands or areas"
            placeholderTextColor={color.subtle}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
          />
          {!!query && (
            <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
              <Feather name="x-circle" size={17} color={color.subtle} />
            </Pressable>
          )}
        </View>
        <Pressable onPress={() => setShowFilters(true)} style={[styles.filterBtn, activeCount > 0 && styles.filterBtnOn]} accessibilityLabel="Filters">
          <Feather name="sliders" size={18} color={activeCount > 0 ? '#FFFFFF' : color.ink} />
          {activeCount > 0 && (
            <View style={styles.badge}>
              <AppText variant="smallMedium" color={color.primary} style={{ fontSize: 10, lineHeight: 12 }}>
                {activeCount}
              </AppText>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortRow} contentContainerStyle={{ gap: 8, paddingHorizontal: gutter }}>
        <Chip label="Recommended" active={sort === 'recommended'} onPress={() => setSort('recommended')} />
        <Chip label="Top rated" active={sort === 'rating'} onPress={() => setSort('rating')} />
        <Chip label="Lowest price" active={sort === 'price'} onPress={() => setSort('price')} />
      </ScrollView>

      {activeCount > 0 && (
        <View style={styles.filterNote}>
          <AppText variant="small" color={color.text}>
            {activeCount} filter{activeCount === 1 ? '' : 's'} on
          </AppText>
          <Pressable onPress={() => setFilters(DEFAULT_FILTERS)} hitSlop={8}>
            <AppText variant="smallMedium" color={color.primary}>
              Clear all
            </AppText>
          </Pressable>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style={statusBarStyle()} />
      <FlatList
        data={loading ? [] : visible}
        keyExtractor={(c) => c.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: gutter, paddingTop: 16, paddingBottom: TAB_BAR_SPACE }}
        ListHeaderComponent={header}
        ListHeaderComponentStyle={{ marginBottom: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        ListEmptyComponent={
          loading ? (
            <View>
              {[0, 1].map((i) => (
                <View key={i} style={styles.skeleton} />
              ))}
            </View>
          ) : (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Feather name="search" size={22} color={color.primary} />
              </View>
              <AppText variant="subheading" style={{ marginTop: 14 }}>
                No cars match
              </AppText>
              <AppText variant="small" color={color.muted} center style={{ marginTop: 4 }}>
                Try another search or clear your filters.
              </AppText>
              {(activeCount > 0 || !!query) && (
                <Pressable
                  onPress={() => {
                    setFilters(DEFAULT_FILTERS);
                    setQuery('');
                  }}
                  style={styles.clearBtn}
                >
                  <AppText variant="smallMedium" color={color.primary}>
                    Clear search and filters
                  </AppText>
                </Pressable>
              )}
            </View>
          )
        }
        renderItem={({ item }) => (
          <CarListCard car={item} favorite={isFavorite(item.id)} onToggleFavorite={() => toggle(item.id)} onPress={() => onNavigateToCarDetails(item.id)} />
        )}
      />

      <TabBar active="cars" onNavigate={navigate} />

      <FilterModal visible={showFilters} onClose={() => setShowFilters(false)} onApply={setFilters} initial={filters} brands={brands} />
    </View>
  );
};

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  searchRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  searchInput: { flex: 1, height: '100%', fontFamily: font.regular, fontSize: 15, color: color.ink, paddingVertical: 0 },
  filterBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnOn: { backgroundColor: color.primary, borderColor: color.primary },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  sortRow: { marginTop: 14, marginHorizontal: -gutter },
  filterNote: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: color.primarySoft,
  },
  skeleton: { height: 290, borderRadius: radius.xl, backgroundColor: color.sunken, marginBottom: 16 },
  empty: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24, borderRadius: radius.xl, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border },
  emptyIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: color.primarySoft, alignItems: 'center', justifyContent: 'center' },
  clearBtn: { marginTop: 16, paddingHorizontal: 16, height: 38, borderRadius: 19, backgroundColor: color.primarySoft, justifyContent: 'center' },
}));

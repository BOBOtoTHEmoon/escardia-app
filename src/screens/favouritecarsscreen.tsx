import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getUserFavorites, removeFromFavorites } from '../services/favoritesservice';
import { AppText, Screen, ScreenHeader } from '../ui';
import { CarLike, CarListCard } from '../ui/CarCard';
import { color, gutter, radius, themed, statusBarStyle } from '../theme';

interface FavoriteCarsScreenProps {
  onNavigateBack: () => void;
  onNavigateToCarDetails: (carId: string) => void;
}

export const FavoriteCarsScreen: React.FC<FavoriteCarsScreenProps> = ({ onNavigateBack, onNavigateToCarDetails }) => {
  const insets = useSafeAreaInsets();
  const [cars, setCars] = useState<CarLike[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const result = await getUserFavorites();
      if (result.success && result.favorites.length) {
        const { getCar } = await import('../services/carservice');
        const found = await Promise.all(result.favorites.map(async (id: string) => (await getCar(id)).car ?? null));
        setCars(found.filter(Boolean) as CarLike[]);
      }
      setLoading(false);
    })();
  }, []);

  const remove = async (carId: string) => {
    setCars((prev) => prev.filter((c) => c.id !== carId));
    await removeFromFavorites(carId);
  };

  return (
    <Screen>
      <StatusBar style={statusBarStyle()} />
      <ScreenHeader title="Saved cars" subtitle={loading ? undefined : `${cars.length} saved`} onBack={onNavigateBack} />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={color.primary} />
        </View>
      ) : (
        <FlatList
          data={cars}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ paddingHorizontal: gutter, paddingTop: 8, paddingBottom: insets.bottom + 24, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <CarListCard car={item} favorite onToggleFavorite={() => remove(item.id)} onPress={() => onNavigateToCarDetails(item.id)} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="heart-outline" size={26} color={color.primary} />
              </View>
              <AppText variant="heading" style={{ marginTop: 16 }}>
                No saved cars yet
              </AppText>
              <AppText variant="body" color={color.muted} center style={{ marginTop: 6 }}>
                Tap the heart on any car to keep it here for later.
              </AppText>
            </View>
          }
        />
      )}
    </Screen>
  );
};

const styles = themed(() => StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 60 },
  emptyIcon: { width: 64, height: 64, borderRadius: radius.full, backgroundColor: color.primarySoft, alignItems: 'center', justifyContent: 'center' },
}));

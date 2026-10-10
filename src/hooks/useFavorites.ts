import { useCallback, useEffect, useRef, useState } from 'react';
import { addToFavorites, getUserFavorites, removeFromFavorites } from '../services/favoritesservice';

/** The signed-in customer's saved cars, with an optimistic toggle. */
export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const current = useRef<string[]>([]);

  const set = (next: string[]) => {
    current.current = next;
    setFavorites(next);
  };

  const reload = useCallback(async () => {
    const result = await getUserFavorites();
    if (result.success) set(result.favorites);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const toggle = useCallback(async (carId: string) => {
    const wasFav = current.current.includes(carId);
    set(wasFav ? current.current.filter((id) => id !== carId) : [carId, ...current.current]);
    const result = wasFav ? await removeFromFavorites(carId) : await addToFavorites(carId);
    // Put it back if the server said no.
    if (!result.success) set(wasFav ? [carId, ...current.current] : current.current.filter((id) => id !== carId));
  }, []);

  return { favorites, isFavorite: (id: string) => favorites.includes(id), toggle, reload };
};

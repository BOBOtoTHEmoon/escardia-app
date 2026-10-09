// ============================================
// ESCARDIA - Favourites (Supabase)
// ============================================
import { supabase, auth } from '../config/supabase';

export const addToFavorites = async (carId: string) => {
  const user = auth.currentUser;
  if (!user) return { success: false, error: 'User not logged in' };
  const { error } = await supabase.from('favorites').upsert({ user_id: user.uid, car_id: carId }, { onConflict: 'user_id,car_id', ignoreDuplicates: true });
  return error ? { success: false, error: error.message } : { success: true };
};

export const removeFromFavorites = async (carId: string) => {
  const user = auth.currentUser;
  if (!user) return { success: false, error: 'User not logged in' };
  const { error } = await supabase.from('favorites').delete().eq('user_id', user.uid).eq('car_id', carId);
  return error ? { success: false, error: error.message } : { success: true };
};

/** Returns the ids of the user's favourite cars. */
export const getUserFavorites = async () => {
  const user = auth.currentUser;
  if (!user) return { success: false, error: 'User not logged in', favorites: [] as string[] };
  const { data, error } = await supabase.from('favorites').select('car_id').eq('user_id', user.uid).order('created_at', { ascending: false });
  if (error) return { success: false, error: error.message, favorites: [] as string[] };
  return { success: true, favorites: (data ?? []).map((r) => r.car_id as string) };
};

export const isFavorite = async (carId: string): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) return false;
  const { count } = await supabase
    .from('favorites')
    .select('car_id', { count: 'exact', head: true })
    .eq('user_id', user.uid)
    .eq('car_id', carId);
  return (count ?? 0) > 0;
};

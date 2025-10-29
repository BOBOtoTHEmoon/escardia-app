import { db, auth } from '../config/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';

export const addToFavorites = async (carId: string) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'User not logged in' };
    }

    // Create a unique document ID combining userId and carId
    const favoriteId = `${user.uid}_${carId}`;
    
    await setDoc(doc(db, 'favorites', favoriteId), {
      userId: user.uid,
      carId: carId,
      createdAt: new Date().toISOString(),
    });

    console.log('✅ Added to favorites:', carId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error adding to favorites:', error);
    return { success: false, error: String(error) };
  }
};

export const removeFromFavorites = async (carId: string) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'User not logged in' };
    }

    const favoriteId = `${user.uid}_${carId}`;
    await deleteDoc(doc(db, 'favorites', favoriteId));

    console.log('✅ Removed from favorites:', carId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error removing from favorites:', error);
    return { success: false, error: String(error) };
  }
};

export const getUserFavorites = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'User not logged in', favorites: [] };
    }

    const q = query(
      collection(db, 'favorites'),
      where('userId', '==', user.uid)
    );

    const snapshot = await getDocs(q);
    const favoriteCarIds = snapshot.docs.map(doc => doc.data().carId);

    console.log(`✅ Loaded ${favoriteCarIds.length} favorites`);
    return { success: true, favorites: favoriteCarIds };
  } catch (error) {
    console.error('❌ Error loading favorites:', error);
    return { success: false, error: String(error), favorites: [] };
  }
};

export const isFavorite = async (carId: string): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) return false;

    const favoriteId = `${user.uid}_${carId}`;
    const docRef = doc(db, 'favorites', favoriteId);
    const docSnap = await getDocs(query(collection(db, 'favorites'), where('__name__', '==', favoriteId)));

    return !docSnap.empty;
  } catch (error) {
    console.error('Error checking favorite:', error);
    return false;
  }
};
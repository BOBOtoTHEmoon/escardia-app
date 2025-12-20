import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_KEY = 'escardia_user_location';
const LOCATION_COORDS_KEY = 'escardia_user_location_coords';

interface SavedLocation {
  name: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  savedAt: string;
}

// Save location to device storage
export const saveUserLocation = async (
  locationName: string,
  coordinates?: { latitude: number; longitude: number }
): Promise<boolean> => {
  try {
    const locationData: SavedLocation = {
      name: locationName,
      coordinates,
      savedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(locationData));
    console.log('✅ Location saved:', locationName);
    return true;
  } catch (error) {
    console.error('❌ Error saving location:', error);
    return false;
  }
};

// Load location from device storage
export const loadUserLocation = async (): Promise<SavedLocation | null> => {
  try {
    const stored = await AsyncStorage.getItem(LOCATION_KEY);
    
    if (stored) {
      const locationData: SavedLocation = JSON.parse(stored);
      console.log('✅ Location loaded:', locationData.name);
      return locationData;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error loading location:', error);
    return null;
  }
};

// Get just the location name (convenience function)
export const getStoredLocationName = async (): Promise<string | null> => {
  const location = await loadUserLocation();
  return location?.name || null;
};

// Get stored coordinates (convenience function)
export const getStoredCoordinates = async (): Promise<{ latitude: number; longitude: number } | null> => {
  const location = await loadUserLocation();
  return location?.coordinates || null;
};

// Clear stored location
export const clearUserLocation = async (): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(LOCATION_KEY);
    console.log('✅ Location cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing location:', error);
    return false;
  }
};
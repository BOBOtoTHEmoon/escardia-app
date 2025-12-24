import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';

interface StaticMapProps {
  location: string; // Address string like "Lekki Phase 1, Lagos"
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  width?: number;
  height?: number;
  zoom?: number;
  style?: object;
  showOpenInMaps?: boolean;
}

const GOOGLE_MAPS_API_KEY = ''; // Add your key here for better maps

// Known locations to avoid API calls
const KNOWN_LOCATIONS: { [key: string]: { latitude: number; longitude: number } } = {
  'victoria island': { latitude: 6.4281, longitude: 3.4219 },
  'vi': { latitude: 6.4281, longitude: 3.4219 },
  'lekki phase 1': { latitude: 6.4698, longitude: 3.5852 },
  'lekki phase 2': { latitude: 6.4500, longitude: 3.5200 },
  'lekki': { latitude: 6.4698, longitude: 3.5852 },
  'ikoyi': { latitude: 6.4549, longitude: 3.4366 },
  'surulere': { latitude: 6.5059, longitude: 3.3509 },
  'ikeja': { latitude: 6.6018, longitude: 3.3515 },
  'yaba': { latitude: 6.5095, longitude: 3.3711 },
  'ajah': { latitude: 6.4667, longitude: 3.5833 },
  'maryland': { latitude: 6.5714, longitude: 3.3643 },
  'festac': { latitude: 6.4698, longitude: 3.2833 },
  'lagos': { latitude: 6.5244, longitude: 3.3792 },
  'abuja': { latitude: 9.0579, longitude: 7.4951 },
  'port harcourt': { latitude: 4.8156, longitude: 7.0498 },
  'ibadan': { latitude: 7.3775, longitude: 3.9470 },
  'kano': { latitude: 12.0022, longitude: 8.5920 },
  'kaduna': { latitude: 10.5264, longitude: 7.4388 },
  'enugu': { latitude: 6.4584, longitude: 7.5464 },
  'benin': { latitude: 6.3350, longitude: 5.6270 },
  'owerri': { latitude: 5.4836, longitude: 7.0333 },
  'calabar': { latitude: 4.9517, longitude: 8.3220 },
  'warri': { latitude: 5.5167, longitude: 5.7500 },
  'asaba': { latitude: 6.1944, longitude: 6.7333 },
  'uyo': { latitude: 5.0500, longitude: 7.9333 },
  'aba': { latitude: 5.1167, longitude: 7.3667 },
  'onitsha': { latitude: 6.1667, longitude: 6.7833 },
  'jos': { latitude: 9.8965, longitude: 8.8583 },
  'ilorin': { latitude: 8.5000, longitude: 4.5500 },
  'abeokuta': { latitude: 7.1475, longitude: 3.3619 },
  'ogba': { latitude: 6.6167, longitude: 3.3333 },
  'magodo': { latitude: 6.6167, longitude: 3.3833 },
  'gbagada': { latitude: 6.5500, longitude: 3.3833 },
  'anthony': { latitude: 6.5667, longitude: 3.3667 },
  'ojota': { latitude: 6.5833, longitude: 3.3833 },
  'berger': { latitude: 6.6000, longitude: 3.3500 },
  'oshodi': { latitude: 6.5500, longitude: 3.3167 },
  'mushin': { latitude: 6.5333, longitude: 3.3500 },
  'apapa': { latitude: 6.4500, longitude: 3.3667 },
  'marina': { latitude: 6.4500, longitude: 3.4000 },
  'sangotedo': { latitude: 6.4667, longitude: 3.6500 },
  'chevron': { latitude: 6.4333, longitude: 3.5333 },
  'oniru': { latitude: 6.4333, longitude: 3.4500 },
};

export const StaticMap: React.FC<StaticMapProps> = ({
  location,
  coordinates,
  width = 400,
  height = 200,
  zoom = 15,
  style,
  showOpenInMaps = true,
}) => {
  const [mapCoords, setMapCoords] = useState<{ latitude: number; longitude: number } | null>(
    coordinates || null
  );
  const [loading, setLoading] = useState(!coordinates);

  // Get coordinates without API call
  useEffect(() => {
    let isMounted = true;

    const getCoords = () => {
      // If coordinates provided, use them
      if (coordinates) {
        setMapCoords(coordinates);
        setLoading(false);
        return;
      }

      // Try to match with known locations (no API call)
      const locationLower = location.toLowerCase();
      
      for (const [key, coords] of Object.entries(KNOWN_LOCATIONS)) {
        if (locationLower.includes(key)) {
          if (isMounted) {
            setMapCoords(coords);
            setLoading(false);
          }
          return;
        }
      }

      // Fallback to Lagos center if no match found
      if (isMounted) {
        setMapCoords({ latitude: 6.5244, longitude: 3.3792 });
        setLoading(false);
      }
    };

    getCoords();

    return () => {
      isMounted = false;
    };
  }, [location, coordinates]);

  // Open location in device maps app
  const openInMaps = () => {
    if (!mapCoords) return;

    const { latitude, longitude } = mapCoords;
    const label = encodeURIComponent(location);

    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
    });

    if (url) {
      Linking.canOpenURL(url).then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          // Fallback to Google Maps web
          Linking.openURL(
            `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
          );
        }
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, style]}>
        <ActivityIndicator size="small" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  // Error state or no coordinates
  if (!mapCoords) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Text style={styles.errorIcon}>🗺️</Text>
        <Text style={styles.errorText}>Map unavailable</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={showOpenInMaps ? openInMaps : undefined}
      activeOpacity={showOpenInMaps ? 0.8 : 1}
      disabled={!showOpenInMaps}
    >
      {/* Map Background */}
      <View style={styles.mapWrapper}>
        {/* Simple colored map background with grid */}
        <View style={styles.mapBackground}>
          {/* Grid lines to simulate map */}
          <View style={styles.gridContainer}>
            {[...Array(8)].map((_, i) => (
              <View key={`h-${i}`} style={[styles.gridLineH, { top: `${(i + 1) * 12}%` }]} />
            ))}
            {[...Array(8)].map((_, i) => (
              <View key={`v-${i}`} style={[styles.gridLineV, { left: `${(i + 1) * 12}%` }]} />
            ))}
          </View>

          {/* Location Pin */}
          <View style={styles.pinContainer}>
            <View style={styles.pinOuter}>
              <View style={styles.pinInner}>
                <Text style={styles.pinIcon}>📍</Text>
              </View>
            </View>
            <View style={styles.pinShadow} />
          </View>

          {/* Location Label */}
          <View style={styles.locationLabel}>
            <Text style={styles.locationLabelText} numberOfLines={1}>
              {location}
            </Text>
          </View>
        </View>

        {/* Open in Maps hint */}
        {showOpenInMaps && (
          <View style={styles.openHint}>
            <Text style={styles.openHintText}>Tap to open in Maps</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E8F4F8',
  },
  loadingContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
  },
  errorContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
  },
  mapWrapper: {
    height: 180,
    position: 'relative',
  },
  mapBackground: {
    flex: 1,
    backgroundColor: '#D4E7ED',
    position: 'relative',
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#B8D4DC',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#B8D4DC',
  },
  pinContainer: {
    position: 'absolute',
    top: '35%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -40 }],
    alignItems: 'center',
  },
  pinOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  pinInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinIcon: {
    fontSize: 20,
  },
  pinShadow: {
    width: 20,
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    marginTop: 4,
  },
  locationLabel: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  locationLabelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  openHint: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  openHintText: {
    fontSize: 11,
    color: '#FFFFFF',
  },
});

export default StaticMap;
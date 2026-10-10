// Real map for a pick-up or delivery address, with a branded pin and a Directions button.
// The address is turned into coordinates by the phone's own geocoder, so no API key is needed in Expo Go.
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import { AppText } from '../ui';
import { brand, color, isDark, radius, shadow, themed } from '../theme';

type Coords = { latitude: number; longitude: number };

// Common Lagos areas, so the map shows instantly for them.
const KNOWN: Record<string, Coords> = {
  'victoria island': { latitude: 6.4281, longitude: 3.4219 },
  'lekki phase 1': { latitude: 6.4474, longitude: 3.4723 },
  'lekki phase 2': { latitude: 6.4378, longitude: 3.5222 },
  lekki: { latitude: 6.4698, longitude: 3.5852 },
  ikoyi: { latitude: 6.4549, longitude: 3.4366 },
  'banana island': { latitude: 6.4642, longitude: 3.4472 },
  oniru: { latitude: 6.4366, longitude: 3.4537 },
  ajah: { latitude: 6.4667, longitude: 3.5833 },
  surulere: { latitude: 6.5059, longitude: 3.3509 },
  ikeja: { latitude: 6.6018, longitude: 3.3515 },
  'ikeja gra': { latitude: 6.5806, longitude: 3.3566 },
  yaba: { latitude: 6.5095, longitude: 3.3711 },
  maryland: { latitude: 6.5714, longitude: 3.3643 },
  gbagada: { latitude: 6.5531, longitude: 3.3925 },
  magodo: { latitude: 6.6143, longitude: 3.3864 },
  'murtala muhammed airport': { latitude: 6.5774, longitude: 3.3212 },
  lagos: { latitude: 6.5244, longitude: 3.3792 },
};
const LAGOS = KNOWN.lagos;

const fromKnown = (address: string): Coords | null => {
  const a = address.toLowerCase();
  // Longest names first so "lekki phase 1" wins over "lekki".
  const key = Object.keys(KNOWN)
    .sort((x, y) => y.length - x.length)
    .find((k) => k !== 'lagos' && a.includes(k));
  return key ? KNOWN[key] : null;
};

const cache = new Map<string, Coords | null>();

const geocode = async (address: string): Promise<Coords | null> => {
  if (cache.has(address)) return cache.get(address)!;
  let result: Coords | null = null;
  try {
    const query = /lagos|nigeria/i.test(address) ? address : `${address}, Lagos, Nigeria`;
    const found = await Location.geocodeAsync(query);
    if (found[0]) result = { latitude: found[0].latitude, longitude: found[0].longitude };
  } catch {
    // Some phones need location permission to geocode; fall back to known areas.
  }
  result = result ?? fromKnown(address);
  cache.set(address, result);
  return result;
};

export const openDirections = (coords: Coords | null, label: string) => {
  const name = encodeURIComponent(label);
  const dest = coords ? `${coords.latitude},${coords.longitude}` : name;
  const url =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?daddr=${dest}&q=${name}`
      : coords
        ? `geo:${dest}?q=${dest}(${name})`
        : `geo:0,0?q=${name}`;
  Linking.openURL(url).catch(() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${coords ? dest : name}`));
};

// Quiet, light map so the blue pin stands out (Google Maps on Android).
const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#f3f5f9' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f8fafc' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dfe8ff' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c4d4fe' }] },
];

// Dark version for dark mode (Google Maps on Android; iPhone uses Apple's own dark map).
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#121828' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8A97B5' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#121828' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1E2740' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#24345F' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0B1430' }] },
];

export const TripMap = ({ address, label = 'Pick-up', height = 200 }: { address: string; label?: string; height?: number }) => {
  const [coords, setCoords] = useState<Coords | null>(() => fromKnown(address));
  const [loading, setLoading] = useState(true);
  const map = useRef<MapView>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    geocode(address).then((c) => {
      if (!alive) return;
      if (c) {
        setCoords(c);
        map.current?.animateToRegion({ ...c, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 400);
      }
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [address]);

  const center = coords ?? LAGOS;
  const approximate = !loading && !coords;

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        ref={map}
        style={StyleSheet.absoluteFill}
        initialRegion={{ ...center, latitudeDelta: coords ? 0.02 : 0.25, longitudeDelta: coords ? 0.02 : 0.25 }}
        customMapStyle={isDark() ? DARK_MAP_STYLE : MAP_STYLE}
        userInterfaceStyle={isDark() ? 'dark' : 'light'}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        showsPointsOfInterest={false}
        showsCompass={false}
        onPress={() => openDirections(coords, address)}
      >
        {coords && (
          <Marker coordinate={coords} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={false}>
            <View style={styles.pinWrap}>
              <View style={styles.pin}>
                <Feather name={label === 'Delivery' ? 'home' : 'map-pin'} size={16} color="#FFFFFF" />
              </View>
              <View style={styles.pinTip} />
            </View>
          </Marker>
        )}
      </MapView>

      <View style={styles.tag}>
        <AppText variant="caption" color={color.primary}>
          {label}
        </AppText>
      </View>

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator color={color.primary} />
        </View>
      )}

      <Pressable onPress={() => openDirections(coords, address)} style={[styles.directions, shadow.md]} accessibilityLabel="Get directions">
        <Feather name="navigation" size={14} color="#FFFFFF" />
        <AppText variant="smallMedium" color="#FFFFFF">
          Directions
        </AppText>
      </Pressable>

      {approximate && (
        <View style={styles.approx}>
          <AppText variant="small" color={color.text} style={{ fontSize: 11 }}>
            Exact spot not found. Tap Directions to search the address.
          </AppText>
        </View>
      )}
    </View>
  );
};

const styles = themed(() => StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: color.sunken },
  pinWrap: { alignItems: 'center' },
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: brand[600],
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.md,
  },
  pinTip: {
    width: 0,
    height: 0,
    marginTop: -2,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: brand[600],
  },
  tag: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 10, height: 26, borderRadius: 13, backgroundColor: color.surface, justifyContent: 'center', ...shadow.sm },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark() ? 'rgba(9,13,24,0.6)' : 'rgba(238,242,248,0.6)' },
  directions: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    backgroundColor: color.navy,
  },
  approx: { position: 'absolute', left: 12, bottom: 12, right: 130, padding: 8, borderRadius: radius.sm, backgroundColor: color.surface },
}));

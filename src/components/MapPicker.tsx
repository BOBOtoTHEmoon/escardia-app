// Full-screen map for choosing the exact pick-up point.
// The customer drags the map under a fixed pin (or searches), and we read the address of the spot.
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button } from '../ui';
import { DARK_MAP_STYLE, MAP_STYLE } from './TripMap';
import { brand, color, font, isDark, radius, shadow, themed } from '../theme';

export type PickedPlace = { latitude: number; longitude: number; address: string };
type Coords = { latitude: number; longitude: number };

const LAGOS: Coords = { latitude: 6.4474, longitude: 3.4723 };
const CLOSE = { latitudeDelta: 0.006, longitudeDelta: 0.006 };

/** Short, readable address from the phone's geocoder. */
export const formatPlace = (a: Location.LocationGeocodedAddress) => {
  const street = [a.streetNumber, a.street].filter(Boolean).join(' ');
  const parts = [a.name && !a.name.includes('+') && a.name !== a.streetNumber ? a.name : null, street || null, a.district || a.subregion, a.city || a.region].filter(
    Boolean
  ) as string[];
  const unique = parts.filter((p, i) => parts.findIndex((q) => q.toLowerCase() === p.toLowerCase()) === i);
  return unique.length ? unique.slice(0, 3).join(', ') : a.formattedAddress || 'Pinned location';
};

export const MapPicker = ({
  visible,
  initial,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  initial?: Coords | null;
  onClose: () => void;
  onConfirm: (place: PickedPlace) => void;
}) => {
  const insets = useSafeAreaInsets();
  const map = useRef<MapView>(null);
  const [center, setCenter] = useState<Coords>(initial ?? LAGOS);
  const [address, setAddress] = useState('');
  const [finding, setFinding] = useState(false);
  const [moving, setMoving] = useState(false);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [canShowMe, setCanShowMe] = useState(false);
  const lookup = useRef(0);

  const move = (c: Coords) => map.current?.animateToRegion({ ...c, ...CLOSE }, 450);

  const readAddress = async (c: Coords) => {
    const id = ++lookup.current;
    setFinding(true);
    try {
      const [a] = await Location.reverseGeocodeAsync(c);
      if (id === lookup.current) setAddress(a ? formatPlace(a) : 'Pinned location');
    } catch {
      if (id === lookup.current) setAddress('Pinned location');
    } finally {
      if (id === lookup.current) setFinding(false);
    }
  };

  const goToMe = async (askIfNeeded = true) => {
    try {
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted' && askIfNeeded) status = (await Location.requestForegroundPermissionsAsync()).status;
      if (status !== 'granted') return false;
      setCanShowMe(true);
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setCenter(c);
      move(c);
      readAddress(c);
      return true;
    } catch {
      return false;
    }
  };

  // Each time the picker opens: start from the last chosen spot, or the customer's location.
  useEffect(() => {
    if (!visible) return;
    setQuery('');
    setSearchError('');
    if (initial) {
      setCenter(initial);
      setTimeout(() => move(initial), 50);
      readAddress(initial);
    } else {
      goToMe(true).then((ok) => {
        if (!ok) readAddress(LAGOS);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const onRegionDone = (r: Region) => {
    setMoving(false);
    const c = { latitude: r.latitude, longitude: r.longitude };
    setCenter(c);
    readAddress(c);
  };

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    Keyboard.dismiss();
    setSearching(true);
    setSearchError('');
    try {
      const found = await Location.geocodeAsync(/lagos|nigeria/i.test(q) ? q : `${q}, Lagos, Nigeria`);
      if (found[0]) move({ latitude: found[0].latitude, longitude: found[0].longitude });
      else setSearchError('We could not find that place. Try a street or area name, or drag the map.');
    } catch {
      setSearchError('Search is not available right now. Drag the map to your spot.');
    } finally {
      setSearching(false);
    }
  };

  const confirm = () => onConfirm({ ...center, address: address || 'Pinned location' });

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <MapView
          ref={map}
          style={StyleSheet.absoluteFill}
          initialRegion={{ ...(initial ?? LAGOS), ...CLOSE }}
          customMapStyle={isDark() ? DARK_MAP_STYLE : MAP_STYLE}
          userInterfaceStyle={isDark() ? 'dark' : 'light'}
          showsUserLocation={canShowMe}
          showsMyLocationButton={false}
          showsPointsOfInterests={false}
          showsCompass={false}
          toolbarEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          onRegionChange={() => !moving && setMoving(true)}
          onRegionChangeComplete={onRegionDone}
        />

        {/* Fixed pin in the middle of the map. It lifts while the map moves. */}
        <View pointerEvents="none" style={styles.pinLayer}>
          <View style={[styles.pinWrap, moving && { transform: [{ translateY: -10 }] }]}>
            <View style={styles.pin}>
              <Feather name="user" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.pinStem} />
          </View>
          <View style={[styles.pinShadow, moving && { opacity: 0.35, transform: [{ scale: 0.7 }] }]} />
        </View>

        {/* Search */}
        <View style={[styles.top, { paddingTop: insets.top + 10 }]}>
          <Pressable onPress={onClose} style={[styles.round, shadow.md]} accessibilityLabel="Close">
            <Feather name="x" size={20} color={color.ink} />
          </Pressable>
          <View style={[styles.search, shadow.md]}>
            <Feather name="search" size={17} color={color.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={search}
              placeholder="Search a street or area"
              placeholderTextColor={color.subtle}
              returnKeyType="search"
              keyboardAppearance={isDark() ? 'dark' : 'light'}
              style={styles.searchInput}
            />
            {searching ? <ActivityIndicator size="small" color={color.primary} /> : null}
          </View>
        </View>
        {!!searchError && (
          <View style={[styles.searchError, { top: insets.top + 68 }]}>
            <AppText variant="small" color={color.text}>
              {searchError}
            </AppText>
          </View>
        )}

        {/* Bottom card */}
        <View style={[styles.sheet, shadow.lg, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable onPress={() => goToMe(true)} style={[styles.meBtn, shadow.md]} accessibilityLabel="Use my current location">
            <Feather name="crosshair" size={18} color={color.primary} />
          </Pressable>
          <AppText variant="caption" color={color.muted}>
            Pick-up point
          </AppText>
          <View style={styles.addressRow}>
            <View style={styles.addressIcon}>
              <Feather name="map-pin" size={16} color={color.primary} />
            </View>
            <AppText variant="bodyMedium" numberOfLines={2} style={{ flex: 1 }}>
              {moving || finding ? 'Finding the address…' : address || 'Move the map to your spot'}
            </AppText>
          </View>
          <AppText variant="small" color={color.muted} style={{ marginBottom: 14 }}>
            Drag the map so the pin sits exactly where your driver should meet you.
          </AppText>
          <Button title="Confirm pick-up point" icon="check" onPress={confirm} disabled={moving || finding} />
        </View>
      </View>
    </Modal>
  );
};

const styles = themed(() =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: color.sunken },
    pinLayer: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
    // The tip of the stem sits on the exact centre of the map.
    pinWrap: { alignItems: 'center', marginBottom: 58 },
    pin: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: brand[600],
      borderWidth: 3,
      borderColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow.md,
    },
    pinStem: { width: 3, height: 14, borderRadius: 2, backgroundColor: brand[600] },
    pinShadow: { position: 'absolute', width: 14, height: 6, borderRadius: 7, backgroundColor: 'rgba(15,23,42,0.35)' },
    top: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 },
    round: { width: 46, height: 46, borderRadius: 23, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' },
    search: {
      flex: 1,
      height: 46,
      borderRadius: 23,
      backgroundColor: color.surface,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
    },
    searchInput: { flex: 1, fontFamily: font.regular, fontSize: 15, color: color.ink, paddingVertical: 0 },
    searchError: { position: 'absolute', left: 16, right: 16, padding: 12, borderRadius: radius.md, backgroundColor: color.surface },
    sheet: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 20,
      paddingTop: 20,
      borderTopLeftRadius: radius.xxl,
      borderTopRightRadius: radius.xxl,
      backgroundColor: color.surface,
    },
    meBtn: {
      position: 'absolute',
      right: 16,
      top: -62,
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: color.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 6 },
    addressIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: color.primarySoft, alignItems: 'center', justifyContent: 'center' },
  })
);

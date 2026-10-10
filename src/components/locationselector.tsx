// Pick your area on Home: use the phone's location, search, or choose a Lagos area.
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import { AppText, TextField } from '../ui';
import { BottomSheet } from '../ui/Kit';
import { color, radius, themed } from '../theme';

interface LocationSelectorProps {
  visible: boolean;
  currentLocation: string;
  onClose: () => void;
  onSelectLocation: (location: string, coordinates?: { latitude: number; longitude: number }) => void;
}

// Escardia operates in Lagos.
const AREAS: { name: string; coords: { latitude: number; longitude: number } }[] = [
  { name: 'Victoria Island, Lagos', coords: { latitude: 6.4281, longitude: 3.4219 } },
  { name: 'Ikoyi, Lagos', coords: { latitude: 6.4549, longitude: 3.4366 } },
  { name: 'Lekki Phase 1, Lagos', coords: { latitude: 6.4474, longitude: 3.4723 } },
  { name: 'Lekki, Lagos', coords: { latitude: 6.4698, longitude: 3.5852 } },
  { name: 'Oniru, Lagos', coords: { latitude: 6.4366, longitude: 3.4537 } },
  { name: 'Banana Island, Lagos', coords: { latitude: 6.4642, longitude: 3.4472 } },
  { name: 'Ajah, Lagos', coords: { latitude: 6.4667, longitude: 3.5833 } },
  { name: 'Ikeja, Lagos', coords: { latitude: 6.6018, longitude: 3.3515 } },
  { name: 'Ikeja GRA, Lagos', coords: { latitude: 6.5806, longitude: 3.3566 } },
  { name: 'Surulere, Lagos', coords: { latitude: 6.5059, longitude: 3.3509 } },
  { name: 'Yaba, Lagos', coords: { latitude: 6.5095, longitude: 3.3711 } },
  { name: 'Gbagada, Lagos', coords: { latitude: 6.5531, longitude: 3.3925 } },
  { name: 'Maryland, Lagos', coords: { latitude: 6.5714, longitude: 3.3643 } },
  { name: 'Magodo, Lagos', coords: { latitude: 6.6143, longitude: 3.3864 } },
  { name: 'Festac, Lagos', coords: { latitude: 6.4698, longitude: 3.2833 } },
];

const formatAddress = (a: Location.LocationGeocodedAddress) => {
  const parts = [a.name && !a.name.includes('+') ? a.name : null, a.street, a.district || a.subregion, a.city || a.region].filter(Boolean) as string[];
  const unique = parts.filter((p, i) => parts.indexOf(p) === i);
  return unique.length ? unique.slice(0, 3).join(', ') : a.formattedAddress || 'Lagos';
};

export const LocationSelector: React.FC<LocationSelectorProps> = ({ visible, currentLocation, onClose, onSelectLocation }) => {
  const [q, setQ] = useState('');
  const [locating, setLocating] = useState(false);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? AREAS.filter((a) => a.name.toLowerCase().includes(s)) : AREAS;
  }, [q]);

  const pick = (name: string, coords?: { latitude: number; longitude: number }) => {
    onSelectLocation(name, coords);
    setQ('');
    onClose();
  };

  const useMyLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location is off', 'Allow Escardia to use your location in your phone settings, or pick your area from the list.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = pos.coords;
      const [addr] = await Location.reverseGeocodeAsync({ latitude, longitude });
      pick(addr ? formatAddress(addr) : 'Current location', { latitude, longitude });
    } catch {
      Alert.alert('Could not find you', 'Please try again or pick your area from the list.');
    } finally {
      setLocating(false);
    }
  };

  const typed = q.trim();
  const custom = typed.length > 2 && !AREAS.some((a) => a.name.toLowerCase() === typed.toLowerCase());

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Your location" subtitle="We show cars and pick-up times for this area.">
      <Pressable onPress={useMyLocation} disabled={locating} style={({ pressed }) => [styles.mine, pressed && { opacity: 0.9 }]}>
        <View style={styles.mineIcon}>{locating ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Feather name="navigation" size={16} color="#FFFFFF" />}</View>
        <View style={{ flex: 1 }}>
          <AppText variant="bodyMedium">Use my current location</AppText>
          <AppText variant="small" color={color.muted}>
            {locating ? 'Finding you…' : 'Uses your phone’s location'}
          </AppText>
        </View>
      </Pressable>

      <TextField icon="search" placeholder="Search an area in Lagos" value={q} onChangeText={setQ} autoCorrect={false} returnKeyType="done" onSubmitEditing={() => custom && pick(typed)} containerStyle={{ marginTop: 14, marginBottom: 6 }} />

      <ScrollView style={{ maxHeight: 340 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {custom && (
          <Pressable onPress={() => pick(typed)} style={styles.row}>
            <Feather name="plus" size={16} color={color.primary} />
            <AppText variant="bodyMedium" color={color.primary} style={{ flex: 1 }} numberOfLines={1}>
              Use “{typed}”
            </AppText>
          </Pressable>
        )}
        {list.map((a) => {
          const on = a.name === currentLocation;
          return (
            <Pressable key={a.name} onPress={() => pick(a.name, a.coords)} style={({ pressed }) => [styles.row, pressed && { backgroundColor: color.sunken }]}>
              <Feather name="map-pin" size={16} color={on ? color.primary : color.subtle} />
              <AppText variant={on ? 'bodyMedium' : 'body'} color={on ? color.primary : color.ink} style={{ flex: 1 }}>
                {a.name}
              </AppText>
              {on && <Feather name="check" size={18} color={color.primary} />}
            </Pressable>
          );
        })}
        {!list.length && !custom && (
          <AppText variant="small" color={color.muted} style={{ paddingVertical: 14 }}>
            No match. Type at least three letters to use your own address.
          </AppText>
        )}
      </ScrollView>
    </BottomSheet>
  );
};

const styles = themed(() =>
  StyleSheet.create({
    mine: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: color.primarySoft, borderWidth: 1, borderColor: color.primaryBorder },
    mineIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: color.border },
  })
);

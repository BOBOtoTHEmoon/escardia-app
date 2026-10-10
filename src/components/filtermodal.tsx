import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, IconButton } from '../ui';
import { color, gutter, radius, themed } from '../theme';
import { CAR_TYPES } from '../data/carTypes';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  /** Filters currently in use, so the sheet opens with them selected. */
  initial?: FilterOptions;
  /** Brands to offer; defaults to a fixed list. */
  brands?: string[];
}

export interface FilterOptions {
  brand: string;
  carType: string;
  transmission: string;
  seats: string;
  minPrice: number;
  maxPrice: number;
}

const MAX = 5000000;
const BRANDS = ['All', 'Toyota', 'Mercedes', 'Lexus', 'BMW', 'Honda', 'Range Rover'];
const TYPES = ['All', ...CAR_TYPES];
const GEARBOX = ['All', 'Automatic', 'Manual'];
const SEATS = ['All', '2', '4', '5', '6+'];
const PRICES: { label: string; min: number; max: number }[] = [
  { label: 'Any price', min: 0, max: MAX },
  { label: 'Under ₦100k', min: 0, max: 100000 },
  { label: '₦100k to ₦250k', min: 100000, max: 250000 },
  { label: '₦250k to ₦500k', min: 250000, max: 500000 },
  { label: 'Over ₦500k', min: 500000, max: MAX },
];

const DEFAULTS: FilterOptions = { brand: 'All', carType: 'All', transmission: 'All', seats: 'All', minPrice: 0, maxPrice: MAX };

export const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose, onApply, initial, brands }) => {
  const insets = useSafeAreaInsets();
  const [f, setF] = useState<FilterOptions>(initial ?? DEFAULTS);

  useEffect(() => {
    if (visible) setF(initial ?? DEFAULTS);
  }, [visible, initial]);

  const set = (patch: Partial<FilterOptions>) => setF((prev) => ({ ...prev, ...patch }));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <AppText variant="heading">Filters</AppText>
            <IconButton icon="x" size={36} onPress={onClose} accessibilityLabel="Close filters" />
          </View>

          <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
            <Group title="Price per day">
              {PRICES.map((p) => (
                <Chip
                  key={p.label}
                  label={p.label}
                  active={f.minPrice === p.min && f.maxPrice === p.max}
                  onPress={() => set({ minPrice: p.min, maxPrice: p.max })}
                />
              ))}
            </Group>
            <Group title="Brand">
              {(brands?.length ? ['All', ...brands.filter((b) => b !== 'All')] : BRANDS).map((b) => (
                <Chip key={b} label={b} active={f.brand === b} onPress={() => set({ brand: b })} />
              ))}
            </Group>
            <Group title="Car type">
              {TYPES.map((t) => (
                <Chip key={t} label={t} active={f.carType === t} onPress={() => set({ carType: t })} />
              ))}
            </Group>
            <Group title="Gearbox">
              {GEARBOX.map((t) => (
                <Chip key={t} label={t} active={f.transmission === t} onPress={() => set({ transmission: t })} />
              ))}
            </Group>
            <Group title="Seats">
              {SEATS.map((t) => (
                <Chip key={t} label={t === 'All' ? 'Any' : t} active={f.seats === t} onPress={() => set({ seats: t })} />
              ))}
            </Group>
          </ScrollView>

          <View style={styles.footer}>
            <Button title="Reset" variant="secondary" onPress={() => setF(DEFAULTS)} style={{ flex: 1 }} />
            <Button
              title="Show cars"
              onPress={() => {
                onApply(f);
                onClose();
              }}
              style={{ flex: 2 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={{ marginTop: 20 }}>
    <AppText variant="subheading" style={{ marginBottom: 10, fontSize: 15 }}>
      {title}
    </AppText>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>
  </View>
);

export const Chip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
  <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]} accessibilityRole="button" accessibilityState={{ selected: active }}>
    <AppText variant="smallMedium" color={active ? '#FFFFFF' : color.text} style={{ fontSize: 14 }}>
      {label}
    </AppText>
  </Pressable>
);

const styles = themed(() => StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: color.overlay },
  sheet: { backgroundColor: color.surface, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: color.border, marginTop: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: gutter, paddingTop: 10 },
  chip: {
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: color.primary, borderColor: color.primary },
  footer: { flexDirection: 'row', gap: 12, paddingHorizontal: gutter, paddingTop: 16, borderTopWidth: 1, borderTopColor: color.border, marginTop: 12 },
}));


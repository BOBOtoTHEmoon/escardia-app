// Vendor drivers: add, edit and remove, with what each driver is doing next.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { auth } from '../config/supabase';
import { getVendorBookings, Booking } from '../services/bookingService';
import { addDriver, deleteDriver, getDrivers, updateDriver, Driver } from '../services/vendorService';
import { AppText, Button, Screen, ScreenHeader, TextField } from '../ui';
import { Avatar } from '../ui/Avatar';
import { BottomSheet, EmptyState, Pill, PhotoSourceSheet, Skeleton, pickImage } from '../ui/Kit';
import { color, gutter, radius, themed, statusBarStyle } from '../theme';

interface ManageDriversScreenProps {
  onNavigateBack: () => void;
}

export const ManageDriversScreen: React.FC<ManageDriversScreenProps> = ({ onNavigateBack }) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Driver | 'new' | null>(null);

  const load = useCallback(async () => {
    try {
      const [d, b] = await Promise.all([getDrivers(), getVendorBookings(auth.currentUser?.uid ?? '')]);
      setDrivers(d);
      setBookings(b.bookings);
      setError('');
    } catch (e: any) {
      setError(e?.message || 'Could not load your drivers');
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** What each driver is doing: on a trip now, or their next trip. */
  const schedule = useMemo(() => {
    const map: Record<string, { now?: Booking; next?: Booking; trips: number }> = {};
    for (const b of bookings) {
      const id = b.driver?.id;
      if (!id) continue;
      map[id] ??= { trips: 0 };
      if (b.bookingStatus === 'completed' || b.bookingStatus === 'resolved') map[id].trips++;
      if (b.bookingStatus === 'ongoing') map[id].now = b;
      if (b.bookingStatus === 'confirmed' && (!map[id].next || +new Date(b.startAt) < +new Date(map[id].next!.startAt))) map[id].next = b;
    }
    return map;
  }, [bookings]);

  const remove = (d: Driver) => {
    const s = schedule[d.id];
    Alert.alert(
      `Remove ${d.name}?`,
      s?.now || s?.next ? 'This driver is assigned to an upcoming trip. Assign someone else to that booking after removing them.' : 'You can add them again later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const r = await deleteDriver(d.id);
            if (!r.success) return Alert.alert('Could not remove', r.error);
            setEditing(null);
            load();
          },
        },
      ]
    );
  };

  return (
    <Screen>
      <StatusBar style={statusBarStyle()} />
      <ScreenHeader
        title="Drivers"
        subtitle={loading ? undefined : `${drivers.length} driver${drivers.length === 1 ? '' : 's'}`}
        onBack={onNavigateBack}
        right={drivers.length > 0 ? <Button title="Add" size="md" icon="plus" onPress={() => setEditing('new')} style={{ paddingHorizontal: 16 }} /> : undefined}
      />
      <FlatList
        data={loading ? [] : drivers}
        keyExtractor={(d) => d.id}
        contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 40, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        ListHeaderComponent={
          drivers.length > 0 ? (
            <AppText variant="small" color={color.muted} style={{ marginBottom: 12 }}>
              Customers see the name, photo and phone number of the driver on their trip.
            </AppText>
          ) : null
        }
        renderItem={({ item: d }) => {
          const s = schedule[d.id];
          return (
            <Pressable onPress={() => setEditing(d)} style={({ pressed }) => [styles.card, pressed && { opacity: 0.95 }]}>
              <Avatar uri={d.photoUrl} name={d.name} size={52} background={color.primary} ring="transparent" />
              <View style={{ flex: 1 }}>
                <AppText variant="subheading" numberOfLines={1}>
                  {d.name}
                </AppText>
                <AppText variant="small" color={color.muted} numberOfLines={1}>
                  {[d.phone, d.experience && `${d.experience} driving`].filter(Boolean).join(' · ')}
                </AppText>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {s?.now ? (
                    <Pill label="On a trip now" tone="green" />
                  ) : s?.next ? (
                    <Pill label={`Next: ${s.next.startDate}`} tone="blue" />
                  ) : (
                    <Pill label="Free" tone="slate" />
                  )}
                  {!!s?.trips && <Pill label={`${s.trips} trip${s.trips === 1 ? '' : 's'}`} tone="slate" icon="check" />}
                </View>
              </View>
              {!!d.phone && (
                <Pressable onPress={() => Linking.openURL(`tel:${d.phone.replace(/[^\d+]/g, '')}`)} style={styles.call} hitSlop={6} accessibilityLabel={`Call ${d.name}`}>
                  <Feather name="phone" size={16} color={color.primary} />
                </Pressable>
              )}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <View>
              <Skeleton height={92} />
              <Skeleton height={92} />
            </View>
          ) : error ? (
            <EmptyState icon="wifi-off" title="Could not load drivers" body={error} action={<Button title="Try again" size="md" variant="secondary" onPress={load} />} />
          ) : (
            <EmptyState
              icon="users"
              title="Add your drivers"
              body="Every Escardia trip comes with a driver. Add yours here, then assign one to each booking."
              action={<Button title="Add a driver" size="md" icon="user-plus" onPress={() => setEditing('new')} />}
            />
          )
        }
      />

      <DriverSheet
        driver={editing === 'new' ? null : editing}
        visible={editing !== null}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
        onRemove={editing && editing !== 'new' ? () => remove(editing) : undefined}
      />
    </Screen>
  );
};

const DriverSheet = ({
  driver,
  visible,
  onClose,
  onSaved,
  onRemove,
}: {
  driver: Driver | null;
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  onRemove?: () => void;
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [licence, setLicence] = useState('');
  const [experience, setExperience] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoSheet, setPhotoSheet] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(driver?.name ?? '');
    setPhone(driver?.phone ?? '');
    setLicence(driver?.licenseNumber ?? '');
    setExperience(driver?.experience ?? '');
    setPhoto(driver?.photoUrl ?? null);
    setErrors({});
  }, [visible, driver]);

  const save = async () => {
    const next: typeof errors = {};
    const digits = phone.replace(/\D/g, '');
    if (name.trim().length < 2) next.name = 'Enter the driver’s full name';
    if (digits.length < 10 || digits.length > 14) next.phone = 'Enter a valid number, like 0803 123 4567';
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    const data = { name, phone, licenseNumber: licence, experience, photoUrl: photo };
    const r = driver ? await updateDriver(driver.id, data) : await addDriver(data);
    setSaving(false);
    if (!r.success) return Alert.alert('Could not save', r.error || 'Please try again.');
    onSaved();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={driver ? 'Edit driver' : 'Add a driver'}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => setPhotoSheet(true)} style={styles.photoRow}>
          <Avatar uri={photo} name={name || 'Driver'} size={60} background={color.primary} ring="transparent" />
          <View style={{ flex: 1 }}>
            <AppText variant="bodyMedium" color={color.primary}>
              {photo ? 'Change photo' : 'Add a photo'}
            </AppText>
            <AppText variant="small" color={color.muted}>
              Optional. Helps customers recognise their driver.
            </AppText>
          </View>
        </Pressable>
        <TextField label="Full name" icon="user" placeholder="Tunde Bakare" value={name} onChangeText={setName} autoCapitalize="words" error={errors.name} />
        <TextField label="Phone number" icon="phone" placeholder="0803 123 4567" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={errors.phone} hint="Customers can call this number during their trip." />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TextField label="Licence number" placeholder="Optional" value={licence} onChangeText={setLicence} autoCapitalize="characters" containerStyle={{ flex: 1 }} />
          <TextField label="Experience" placeholder="e.g. 5 years" value={experience} onChangeText={setExperience} containerStyle={{ flex: 1 }} />
        </View>
        <Button title={driver ? 'Save changes' : 'Add driver'} icon="check" onPress={save} loading={saving} />
        {onRemove && (
          <Button title="Remove driver" variant="ghost" onPress={onRemove} style={{ marginTop: 6 }} />
        )}
      </ScrollView>
      <PhotoSourceSheet
        visible={photoSheet}
        title="Driver photo"
        onClose={() => setPhotoSheet(false)}
        onPick={async (source) => {
          const r = await pickImage(source, { aspect: [1, 1], quality: 0.6 });
          setPhotoSheet(false);
          if (r?.[0]) setPhoto(r[0]);
        }}
        onRemove={photo ? () => (setPhotoSheet(false), setPhoto(null)) : undefined}
      />
    </BottomSheet>
  );
};

const styles = themed(() => StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 12, borderRadius: radius.xl, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border },
  call: { width: 40, height: 40, borderRadius: 20, backgroundColor: color.primarySoft, alignItems: 'center', justifyContent: 'center' },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
}));

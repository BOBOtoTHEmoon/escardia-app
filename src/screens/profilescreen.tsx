import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { pickImage } from '../ui/Kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, supabase, uploadImage } from '../config/supabase';
import { getUserProfile, updateUserProfile, UserProfile } from '../services/authservice';
import { getWalletBalance } from '../services/walletService';
import { getUnreadNotificationCount } from '../services/notificationService';
import { AppText, Button, IconButton, TextField } from '../ui';
import { naira } from '../ui/CarCard';
import { MenuGroup, MenuRow } from '../ui/Menu';
import { AppearanceRow } from '../ui/Appearance';
import { Avatar } from '../ui/Avatar';
import { TabBar, TAB_BAR_SPACE } from '../ui/TabBar';
import { brand, color, gutter, radius, themed } from '../theme';

interface ProfileScreenProps {
  onNavigateBack: () => void;
  userName?: string;
  userEmail?: string;
  onNavigateToHome: () => void;
  onNavigateToCars: () => void;
  onNavigateToTrips: () => void;
  onNavigateToFavorites: () => void;
  onNavigateToSupport: () => void;
  onNavigateToSecurityLoginSafety: () => void;
  onNavigateToWallet: () => void;
  onNavigateToVendorOnboarding: () => void;
  onNavigateToWelcome: () => void;
  onNavigateToNotifications?: () => void;
  /** Lets App refresh the name shown on Home after an edit. */
  onProfileChanged?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  userName = '',
  userEmail = '',
  onNavigateToHome,
  onNavigateToCars,
  onNavigateToTrips,
  onNavigateToFavorites,
  onNavigateToSupport,
  onNavigateToSecurityLoginSafety,
  onNavigateToWallet,
  onNavigateToVendorOnboarding,
  onNavigateToWelcome,
  onNavigateToNotifications,
  onProfileChanged,
}) => {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [unread, setUnread] = useState(0);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoSheet, setPhotoSheet] = useState(false);

  const load = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const [p, b, n] = await Promise.all([getUserProfile(uid), getWalletBalance(uid).catch(() => null), getUnreadNotificationCount().catch(() => 0)]);
    if (p.success && p.data) setProfile(p.data);
    setBalance(b);
    setUnread(n);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const name = profile ? [profile.firstName, profile.lastName].filter(Boolean).join(' ') : userName;
  const email = profile?.email || userEmail;

  const savePhoto = async (url: string | null) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const r = await updateUserProfile(uid, { avatarUrl: url });
    if (!r.success) throw new Error(r.error);
    await load();
    onProfileChanged?.();
  };

  const pickPhoto = async (source: 'camera' | 'library') => {
    // Open the picker while the sheet is still up; iOS ignores it if the sheet is closing.
    const picked = await pickImage(source, { aspect: [1, 1], quality: 0.6 });
    setPhotoSheet(false);
    if (!picked?.[0]) return;
    setUploading(true);
    try {
      await savePhoto(await uploadImage(picked[0], 'avatars', 'avatar'));
    } catch (e: any) {
      Alert.alert('Could not update photo', e?.message || 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async () => {
    setPhotoSheet(false);
    setUploading(true);
    try {
      await savePhoto(null);
    } catch (e: any) {
      Alert.alert('Could not remove photo', e?.message || 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const logout = () =>
    Alert.alert('Log out?', 'You will need your email and password to sign back in.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          onNavigateToWelcome();
        },
      },
    ]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.glow} />
          <View style={styles.headerRow}>
            <Pressable onPress={() => setPhotoSheet(true)} style={styles.avatarWrap} accessibilityLabel="Change profile photo">
              <Avatar uri={profile?.avatarUrl} name={name} size={68} />
              <View style={styles.cam}>{uploading ? <ActivityIndicator size="small" color={color.primary} /> : <Feather name="camera" size={12} color={color.primary} />}</View>
            </Pressable>
            <View style={{ flex: 1 }}>
              <AppText variant="heading" color="#FFFFFF" numberOfLines={1}>
                {name || 'Your profile'}
              </AppText>
              <AppText variant="small" color={color.onDarkMuted} numberOfLines={1}>
                {email}
              </AppText>
              {!!profile?.phoneNumber && (
                <AppText variant="small" color={color.onDarkMuted}>
                  {profile.phoneNumber}
                </AppText>
              )}
              {profile && !profile.avatarUrl && (
                <Pressable onPress={() => setPhotoSheet(true)} hitSlop={6}>
                  <AppText variant="smallMedium" color={brand[200]} style={{ marginTop: 4 }}>
                    Add a profile photo
                  </AppText>
                </Pressable>
              )}
            </View>
            <IconButton icon="edit-2" dark size={40} onPress={() => setEditing(true)} accessibilityLabel="Edit profile" />
          </View>

          <Pressable onPress={onNavigateToWallet} style={styles.wallet}>
            <View style={styles.walletIcon}>
              <Feather name="pocket" size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="small" color={color.onDarkMuted}>
                Wallet balance
              </AppText>
              <AppText variant="subheading" color="#FFFFFF">
                {balance === null ? '…' : naira(balance)}
              </AppText>
            </View>
            <AppText variant="smallMedium" color={brand[200]}>
              Open
            </AppText>
            <Feather name="chevron-right" size={16} color={brand[200]} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: gutter }}>
          <MenuGroup title="Account">
            <MenuRow icon="pocket" label="Wallet" hint="Top up and see your activity" onPress={onNavigateToWallet} />
            <MenuRow icon="heart" label="Saved cars" onPress={onNavigateToFavorites} />
            {onNavigateToNotifications && (
              <MenuRow
                icon="bell"
                label="Notifications"
                onPress={onNavigateToNotifications}
                right={
                  unread > 0 ? (
                    <View style={styles.badge}>
                      <AppText variant="smallMedium" color="#FFFFFF" style={{ fontSize: 11 }}>
                        {unread}
                      </AppText>
                    </View>
                  ) : undefined
                }
              />
            )}
            <MenuRow icon="lock" label="Password and safety" onPress={onNavigateToSecurityLoginSafety} />
            <AppearanceRow last />
          </MenuGroup>

          <Pressable onPress={onNavigateToVendorOnboarding} style={styles.vendor}>
            <View style={styles.vendorIcon}>
              <Feather name="briefcase" size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="subheading">Own a luxury car?</AppText>
              <AppText variant="small" color={color.text}>
                List it on Escardia and earn from every trip.
              </AppText>
            </View>
            <Feather name="arrow-right" size={18} color={color.primary} />
          </Pressable>

          <MenuGroup title="Help">
            <MenuRow icon="help-circle" label="Help and support" hint="FAQs, policies and contact" onPress={onNavigateToSupport} last />
          </MenuGroup>

          <MenuGroup>
            <MenuRow icon="log-out" label="Log out" danger onPress={logout} right={<View />} last />
          </MenuGroup>

          <AppText variant="small" color={color.subtle} center style={{ marginTop: 20 }}>
            Escardia · Version 1.0
          </AppText>
        </View>
      </ScrollView>

      <TabBar
        active="profile"
        onNavigate={(t) => (t === 'home' ? onNavigateToHome() : t === 'cars' ? onNavigateToCars() : t === 'trips' ? onNavigateToTrips() : undefined)}
      />

      <PhotoSheet
        visible={photoSheet}
        hasPhoto={!!profile?.avatarUrl}
        onClose={() => setPhotoSheet(false)}
        onCamera={() => pickPhoto('camera')}
        onLibrary={() => pickPhoto('library')}
        onRemove={removePhoto}
      />

      {profile && (
        <EditProfileSheet
          visible={editing}
          profile={profile}
          onClose={() => setEditing(false)}
          onSaved={async () => {
            setEditing(false);
            await load();
            onProfileChanged?.();
          }}
        />
      )}
    </View>
  );
};

const PhotoSheet = ({
  visible,
  hasPhoto,
  onClose,
  onCamera,
  onLibrary,
  onRemove,
}: {
  visible: boolean;
  hasPhoto: boolean;
  onClose: () => void;
  onCamera: () => void;
  onLibrary: () => void;
  onRemove: () => void;
}) => {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <AppText variant="heading">Profile photo</AppText>
          <AppText variant="small" color={color.muted} style={{ marginTop: 2, marginBottom: 12 }}>
            Optional. It helps your driver and vendor recognise you.
          </AppText>
          <MenuGroup>
            <MenuRow icon="camera" label="Take a photo" onPress={onCamera} />
            <MenuRow icon="image" label="Choose from your photos" onPress={onLibrary} last={!hasPhoto} />
            {hasPhoto && <MenuRow icon="trash-2" label="Remove photo" danger onPress={onRemove} right={<View />} last />}
          </MenuGroup>
          <Button title="Cancel" variant="secondary" onPress={onClose} style={{ marginTop: 14 }} />
        </View>
      </View>
    </Modal>
  );
};

const EditProfileSheet = ({ visible, profile, onClose, onSaved }: { visible: boolean; profile: UserProfile; onClose: () => void; onSaved: () => void }) => {
  const insets = useSafeAreaInsets();
  const [first, setFirst] = useState(profile.firstName);
  const [last, setLast] = useState(profile.lastName);
  const [phone, setPhone] = useState(profile.phoneNumber);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setFirst(profile.firstName);
      setLast(profile.lastName);
      setPhone(profile.phoneNumber);
    }
  }, [visible, profile]);

  const save = async () => {
    if (!first.trim() || !last.trim()) return Alert.alert('Name needed', 'Enter your first and last name.');
    const digits = phone.replace(/\D/g, '');
    if (phone && (digits.length < 10 || digits.length > 14)) return Alert.alert('Check your number', 'Enter a valid phone number, like 0803 123 4567.');
    setSaving(true);
    const r = await updateUserProfile(profile.uid, { firstName: first.trim(), lastName: last.trim(), phoneNumber: phone.trim() });
    setSaving(false);
    if (!r.success) return Alert.alert('Could not save', r.error || 'Please try again.');
    onSaved();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <AppText variant="heading" style={{ flex: 1 }}>
              Edit profile
            </AppText>
            <IconButton icon="x" size={36} onPress={onClose} accessibilityLabel="Close" />
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TextField label="First name" value={first} onChangeText={setFirst} autoCapitalize="words" containerStyle={{ flex: 1 }} />
            <TextField label="Last name" value={last} onChangeText={setLast} autoCapitalize="words" containerStyle={{ flex: 1 }} />
          </View>
          <TextField label="Phone number" icon="phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="0803 123 4567" hint="Your driver and vendor use this to reach you." />
          <TextField label="Email" icon="mail" value={profile.email} editable={false} hint="Contact support to change your email." />
          <Button title="Save changes" onPress={save} loading={saving} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  header: { backgroundColor: color.navy, paddingHorizontal: gutter, paddingBottom: 20, borderBottomLeftRadius: radius.xxl, borderBottomRightRadius: radius.xxl, overflow: 'hidden' },
  glow: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: brand[600], opacity: 0.3, top: -150, right: -100 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarWrap: { width: 68, height: 68 },
  cam: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wallet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  walletIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: brand[600], alignItems: 'center', justifyContent: 'center' },
  badge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center' },
  vendor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 22,
    padding: 16,
    borderRadius: radius.xl,
    backgroundColor: color.primarySoft,
    borderWidth: 1,
    borderColor: color.primaryBorder,
  },
  vendorIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: color.overlay },
  sheet: { backgroundColor: color.surface, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, paddingHorizontal: gutter, paddingTop: 10 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: color.border, marginBottom: 12 },
}));

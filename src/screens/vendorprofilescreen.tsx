// Vendor "Account" tab: business identity, logo, status, and everything account related.
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../config/supabase';
import { getVendorProfile, VendorProfile } from '../services/vendorauthservice';
import { getVendorStats, setBusinessLogo, EMPTY_STATS, VendorStats } from '../services/vendorService';
import { getUnreadNotificationCount } from '../services/notificationService';
import { AppText, IconButton } from '../ui';
import { Avatar } from '../ui/Avatar';
import { MenuGroup, MenuRow } from '../ui/Menu';
import { AppearanceRow } from '../ui/Appearance';
import { Pill, PhotoSourceSheet, pickImage } from '../ui/Kit';
import { VendorTabBar, VendorTab, TAB_BAR_SPACE } from '../ui/TabBar';
import { brand, color, gutter, radius, themed } from '../theme';

interface VendorProfileScreenProps {
  onTab: (tab: VendorTab) => void;
  onNavigateToSettings: () => void;
  onNavigateToSupport: () => void;
  onNavigateToNotifications: () => void;
  onNavigateToNotificationPreferences: () => void;
  onNavigateToDocuments: () => void;
  onNavigateToBankDetails: () => void;
  onNavigateToDrivers: () => void;
  onNavigateToAnalytics: () => void;
  onNavigateToTermsAndPrivacy: () => void;
  onProfileChanged?: () => void;
  onLogout: () => void;
}

const STATUS: Record<string, { label: string; tone: 'green' | 'amber' | 'red' }> = {
  approved: { label: 'Verified vendor', tone: 'green' },
  pending: { label: 'In review', tone: 'amber' },
  rejected: { label: 'Not approved', tone: 'red' },
  suspended: { label: 'Suspended', tone: 'red' },
};

export const VendorProfileScreen: React.FC<VendorProfileScreenProps> = ({
  onTab,
  onNavigateToSettings,
  onNavigateToSupport,
  onNavigateToNotifications,
  onNavigateToNotificationPreferences,
  onNavigateToDocuments,
  onNavigateToBankDetails,
  onNavigateToDrivers,
  onNavigateToAnalytics,
  onNavigateToTermsAndPrivacy,
  onProfileChanged,
  onLogout,
}) => {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [stats, setStats] = useState<VendorStats>(EMPTY_STATS);
  const [unread, setUnread] = useState(0);
  const [logoSheet, setLogoSheet] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const id = auth.currentUser?.uid;
    if (!id) return;
    const [p, s, n] = await Promise.all([getVendorProfile(id), getVendorStats(), getUnreadNotificationCount().catch(() => 0)]);
    if (p.success && p.data) setProfile(p.data);
    setStats(s);
    setUnread(n);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changeLogo = async (source: 'camera' | 'library' | 'remove') => {
    let uri: string | null = null;
    if (source !== 'remove') {
      const r = await pickImage(source, { aspect: [1, 1], quality: 0.6 });
      setLogoSheet(false);
      if (!r?.[0]) return;
      uri = r[0];
    } else setLogoSheet(false);
    setUploading(true);
    const r = await setBusinessLogo(uri);
    setUploading(false);
    if (!r.success) return Alert.alert('Could not update the logo', r.error || 'Please try again.');
    await load();
    onProfileChanged?.();
  };

  const logout = () =>
    Alert.alert('Log out?', 'You will need your email and password to sign back in.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: onLogout },
    ]);

  const name = profile?.businessName || 'Your business';
  const owner = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ');
  const status = STATUS[profile?.status ?? 'pending'];

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.glow} />
          <View style={styles.headerRow}>
            <Pressable onPress={() => setLogoSheet(true)} accessibilityLabel="Change business logo">
              <Avatar uri={profile?.logoUrl} name={name} size={68} />
              <View style={styles.cam}>{uploading ? <ActivityIndicator size="small" color={color.primary} /> : <Feather name="camera" size={12} color={color.primary} />}</View>
            </Pressable>
            <View style={{ flex: 1 }}>
              <AppText variant="heading" color="#FFFFFF" numberOfLines={1}>
                {name}
              </AppText>
              {!!owner && (
                <AppText variant="small" color={color.onDarkMuted} numberOfLines={1}>
                  {owner}
                </AppText>
              )}
              <AppText variant="small" color={color.onDarkMuted} numberOfLines={1}>
                {profile?.email}
              </AppText>
              {profile && <Pill label={status.label} tone={status.tone} icon={status.tone === 'green' ? 'check' : undefined} style={{ marginTop: 8 }} />}
            </View>
            <IconButton icon="edit-2" dark size={40} onPress={onNavigateToSettings} accessibilityLabel="Edit business details" />
          </View>

          <View style={styles.stats}>
            <Stat value={String(stats.totalCars)} label="Cars" onPress={() => onTab('fleet')} />
            <View style={styles.statDivider} />
            <Stat value={String(stats.completedBookings)} label="Trips" onPress={() => onTab('bookings')} />
            <View style={styles.statDivider} />
            <Stat value={stats.totalReviews ? stats.averageRating.toFixed(1) : 'New'} label={stats.totalReviews ? `${stats.totalReviews} ratings` : 'Rating'} onPress={onNavigateToAnalytics} />
          </View>
        </View>

        <View style={{ paddingHorizontal: gutter }}>
          <MenuGroup title="Business">
            <MenuRow icon="briefcase" label="Business details" hint="Name, phone and contact person" onPress={onNavigateToSettings} />
            <MenuRow icon="users" label="Drivers" hint="Add drivers and assign them to trips" onPress={onNavigateToDrivers} />
            <MenuRow icon="bar-chart-2" label="Performance" hint="Bookings, ratings and your top cars" onPress={onNavigateToAnalytics} last />
          </MenuGroup>

          <MenuGroup title="Money">
            <MenuRow icon="credit-card" label="Earnings" onPress={() => onTab('earnings')} />
            <MenuRow icon="home" label="Payout account" hint={profile?.bankDetails ? `${profile.bankDetails.bankName} · ${profile.bankDetails.accountNumber}` : 'Add the account we pay you into'} onPress={onNavigateToBankDetails} last />
          </MenuGroup>

          <MenuGroup title="Account">
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
            <MenuRow icon="smartphone" label="Push notifications" hint="Get alerts for new bookings" onPress={onNavigateToNotificationPreferences} />
            <MenuRow icon="file-text" label="Documents" hint="Your ID and business documents" onPress={onNavigateToDocuments} />
            <AppearanceRow last />
          </MenuGroup>

          <MenuGroup title="Help">
            <MenuRow icon="help-circle" label="Help and support" onPress={onNavigateToSupport} />
            <MenuRow icon="shield" label="Vendor agreement and privacy" onPress={onNavigateToTermsAndPrivacy} last />
          </MenuGroup>

          <MenuGroup>
            <MenuRow icon="log-out" label="Log out" danger onPress={logout} right={<View />} last />
          </MenuGroup>

          <AppText variant="small" color={color.subtle} center style={{ marginTop: 20 }}>
            Escardia for vendors · Version 1.0
          </AppText>
        </View>
      </ScrollView>

      <VendorTabBar active="profile" onNavigate={onTab} />

      <PhotoSourceSheet
        visible={logoSheet}
        title="Business logo"
        subtitle="Shown on your account. A square logo works best."
        onClose={() => setLogoSheet(false)}
        onPick={changeLogo}
        onRemove={profile?.logoUrl ? () => changeLogo('remove') : undefined}
      />
    </View>
  );
};

const Stat = ({ value, label, onPress }: { value: string; label: string; onPress?: () => void }) => (
  <Pressable onPress={onPress} style={{ flex: 1, alignItems: 'center' }}>
    <AppText variant="heading" color="#FFFFFF">
      {value}
    </AppText>
    <AppText variant="small" color={color.onDarkMuted} numberOfLines={1}>
      {label}
    </AppText>
  </Pressable>
);

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  header: {
    backgroundColor: color.navy,
    paddingHorizontal: gutter,
    paddingBottom: 22,
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
    overflow: 'hidden',
  },
  glow: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: brand[600], opacity: 0.3, top: -140, right: -100 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  cam: { position: 'absolute', right: -2, bottom: -2, width: 26, height: 26, borderRadius: 13, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center' },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.14)' },
  badge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center' },
}));

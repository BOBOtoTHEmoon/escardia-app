// src/screens/vendorprofilescreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, spacing, borderRadius } from '../constants';
import { uploadProfilePhoto, updateVendorPhoto } from '../services/authservice';
import { auth, db } from '../config/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'; // ← ADDED

interface VendorProfileScreenProps {
  vendorName: string;
  vendorEmail: string;
  businessName: string;
  onNavigateToDashboard: () => void;
  onNavigateToFleet: () => void;
  onNavigateToBookings: () => void;
  onNavigateToEarnings: () => void;
  onNavigateToSettings: () => void;
  onNavigateToSupport: () => void;
  onNavigateToNotificationPreferences: () => void;
  onNavigateToDocuments: () => void;
  onNavigateToBankDetails: () => void;
  onNavigateToAnalytics: () => void;
  onNavigateToTermsAndPrivacy: () => void;
  onLogout: () => void;
}

export const VendorProfileScreen: React.FC<VendorProfileScreenProps> = ({
  vendorName,
  vendorEmail,
  businessName,
  onNavigateToDashboard,
  onNavigateToFleet,
  onNavigateToBookings,
  onNavigateToEarnings,
  onNavigateToSettings,
  onNavigateToSupport,
  onNavigateToNotificationPreferences,
  onNavigateToDocuments,
  onNavigateToBankDetails,
  onNavigateToAnalytics,
  onNavigateToTermsAndPrivacy,
  onLogout,
}) => {
  const [stats, setStats] = useState({
    totalCars: 0,
    totalBookings: 0,
    averageRating: 0,
  });
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadStats();
    loadPhoto();
  }, []);

  const loadPhoto = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const docSnap = await getDoc(doc(db, 'vendors', user.uid)); // ← NOW WORKS
    if (docSnap.exists()) {
      setPhotoUrl(docSnap.data()?.photoUrl || null);
    }
  };

  const loadStats = async () => {
    try {
      const vendorId = auth.currentUser?.uid;
      if (!vendorId) return;

      const carsQuery = query(collection(db, 'cars'), where('vendorId', '==', vendorId));
      const carsSnapshot = await getDocs(carsQuery);
      const totalCars = carsSnapshot.size;

      const bookingsQuery = query(collection(db, 'bookings'), where('vendorId', '==', vendorId));
      const bookingsSnapshot = await getDocs(bookingsQuery);
      const totalBookings = bookingsSnapshot.size;

      const averageRating = 4.8;

      setStats({ totalCars, totalBookings, averageRating });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickAndUploadPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow photo access');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0].uri) return;

    setUploading(true);
    try {
      const url = await uploadProfilePhoto(result.assets[0].uri);
      const user = auth.currentUser;
      if (user) {
        await updateVendorPhoto(user.uid, url);
        setPhotoUrl(url);
        Alert.alert('Success', 'Profile photo updated!');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: onLogout },
    ]);
  };

  const menuItems = [
    { icon: require('../../assets/images/vpwalleticon.png'), title: 'Earnings & Wallet', subtitle: 'View earnings and withdraw funds', onPress: onNavigateToEarnings },
    { icon: require('../../assets/images/vpsettingsicon.png'), title: 'Settings', subtitle: 'Account settings and preferences', onPress: onNavigateToSettings },
    { icon: require('../../assets/images/vpnotificationicon.png'), title: 'Notifications', subtitle: 'Manage notification preferences', onPress: onNavigateToNotificationPreferences },
    { icon: require('../../assets/images/documenticon.png'), title: 'Documents', subtitle: 'Manage verification documents', onPress: onNavigateToDocuments },
    { icon: require('../../assets/images/vendorwalleticon.png'), title: 'Bank Details', subtitle: 'Update payout account information', onPress: onNavigateToBankDetails },
    { icon: require('../../assets/images/analytics.png'), title: 'Analytics', subtitle: 'View detailed business insights', onPress: onNavigateToAnalytics },
    { icon: require('../../assets/images/help.png'), title: 'Help & Support', subtitle: 'Get help and contact support', onPress: onNavigateToSupport },
    { icon: require('../../assets/images/terms.png'), title: 'Terms & Privacy', subtitle: 'View terms of service and privacy policy', onPress: onNavigateToTermsAndPrivacy },
  ];

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <View style={styles.header}>
        <LinearGradient colors={['#2F5FED', '#1E3A8A', '#0F3460']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGradient}>
          <Image source={require('../../assets/images/headerpattern.png')} style={styles.headerPattern} resizeMode="cover" />
        </LinearGradient>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImage}>
                <Text style={styles.profileInitial}>{vendorName.charAt(0)}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.editIcon} onPress={pickAndUploadPhoto} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.editIconText}>Edit</Text>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{vendorName}</Text>
          <Text style={styles.profileEmail}>{vendorEmail}</Text>

          {/* Business Badge */}
          <View style={styles.businessBadge}>
            <Text style={styles.businessIcon}>Building</Text>
            <Text style={styles.businessName}>{businessName}</Text>
          </View>

          {/* Stats */}
          {loading ? (
            <View style={styles.statsContainer}>
              <ActivityIndicator size="small" color={colors.textWhite} />
            </View>
          ) : (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalCars}</Text>
                <Text style={styles.statLabel}>Cars</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalBookings}</Text>
                <Text style={styles.statLabel}>Bookings</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.averageRating.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Content Wrapper */}
      <View style={styles.contentWrapper}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Menu Items */}
          <View style={styles.menuSection}>
            {menuItems.map((item, index) => (
              <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
                <View style={styles.menuIconContainer}>
                  <Image source={item.icon} style={styles.menuIconImage} resizeMode="contain" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <Text style={styles.menuArrow}>Right Arrow</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Image source={require('../../assets/images/logout.png')} style={styles.logoutIcon} resizeMode="contain" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          {/* Version Info */}
          <Text style={styles.versionText}>Escardia Vendor v1.0.0</Text>
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={onNavigateToDashboard}>
          <Image source={require('../../assets/images/homeicon.png')} style={styles.navIcon} resizeMode="contain" />
          <Text style={styles.navLabel}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={onNavigateToFleet}>
          <Image source={require('../../assets/images/caricon.png')} style={styles.navIcon} resizeMode="contain" />
          <Text style={styles.navLabel}>Fleet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={onNavigateToBookings}>
          <Image source={require('../../assets/images/tripicon.png')} style={styles.navIcon} resizeMode="contain" />
          <Text style={styles.navLabel}>Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={onNavigateToEarnings}>
          <Image source={require('../../assets/images/walleticon.png')} style={styles.navIcon} resizeMode="contain" />
          <Text style={styles.navLabel}>Earnings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Image source={require('../../assets/images/profileicon.png')} style={styles.navIconActive} resizeMode="contain" />
          <Text style={styles.navLabelActive}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ← STYLES UNCHANGED (same as before)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 45, paddingBottom: 60, paddingHorizontal: spacing.lg, overflow: 'hidden' },
  headerGradient: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  headerPattern: { position: 'absolute', width: '80%', height: '100%', right: -50, opacity: 1 },
  profileSection: { alignItems: 'center', top: 20 },
  profileImageContainer: { position: 'relative', marginBottom: spacing.md },
  profileImage: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.textWhite, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)' },
  profileInitial: { fontSize: typography.fontSize['3xl'], fontWeight: 'bold', color: colors.primary },
  editIcon: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: colors.textWhite },
  editIconText: { fontSize: 14, color: '#fff' },
  profileName: { fontSize: typography.fontSize['2xl'], fontWeight: 'bold', color: colors.textWhite, marginBottom: spacing.xs },
  profileEmail: { fontSize: typography.fontSize.sm, color: colors.textWhite, opacity: 0.9, marginBottom: spacing.md },
  businessBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.lg, marginBottom: spacing.lg },
  businessIcon: { fontSize: 16, marginRight: spacing.xs },
  businessName: { fontSize: typography.fontSize.sm, color: colors.textWhite, fontWeight: '600' },
  statsContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: borderRadius.xl, padding: spacing.md, minHeight: 70, justifyContent: 'center', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: typography.fontSize['2xl'], fontWeight: 'bold', color: colors.textWhite, marginBottom: spacing.xs },
  statLabel: { fontSize: typography.fontSize.xs, color: colors.textWhite, opacity: 0.9 },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: spacing.md },
  contentWrapper: { flex: 1, marginTop: -20, backgroundColor: colors.background, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, overflow: 'hidden' },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: spacing.xl },
  menuSection: { paddingHorizontal: spacing.lg },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundGray, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm },
  menuIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + '20', justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  menuIconImage: { width: 20, height: 20 },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: typography.fontSize.base, fontWeight: '600', color: colors.text, marginBottom: 4 },
  menuSubtitle: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  menuArrow: { fontSize: 24, color: colors.textSecondary },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EF4444', borderRadius: borderRadius.lg, padding: spacing.md, marginHorizontal: spacing.lg, marginTop: spacing.lg },
  logoutIcon: { width: 20, height: 20, marginRight: spacing.sm, tintColor: colors.textWhite },
  logoutText: { fontSize: typography.fontSize.base, fontWeight: '600', color: colors.textWhite },
  versionText: { fontSize: typography.fontSize.xs, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.lg, marginBottom: spacing.lg },
  bottomSpacing: { height: 100 },
  bottomNav: { flexDirection: 'row', backgroundColor: colors.background, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, paddingVertical: spacing.md, paddingBottom: 20, position: 'absolute', bottom: 20, left: 20, right: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 10 },
  navItem: { flex: 1, alignItems: 'center' },
  navIcon: { width: 24, height: 24, marginBottom: spacing.xs, opacity: 0.5 },
  navIconActive: { width: 24, height: 24, marginBottom: spacing.xs },
  navLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  navLabelActive: { fontSize: typography.fontSize.xs, color: colors.primary, fontWeight: '600' },
});
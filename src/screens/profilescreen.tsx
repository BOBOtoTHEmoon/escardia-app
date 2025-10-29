import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../constants';
import { LogoutModal } from '../components/logoutmodal';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';



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
  }
export const ProfileScreen: React.FC<ProfileScreenProps> = ({ 
  onNavigateBack,
  userName = 'Guest User',
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
}) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
 return (
    <View style={styles.container}>
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Profile Info */}
<View style={styles.profileSection}>
  <View style={styles.profileImageContainer}>
    <View style={styles.profileImage}>
      <Image
        source={require('../../assets/images/profileicon.png')}
        style={styles.logOuticon}
        resizeMode="contain"
      />
    </View>
    <TouchableOpacity style={styles.editIcon}>
      <Image
        source={require('../../assets/images/profile.png')}
        style={styles.logOuticon}
        resizeMode="contain"
      />
    </TouchableOpacity>
  </View>

  <Text style={styles.profileName}>{userName}</Text>
  <Text style={styles.profileEmail}>{userEmail}</Text>
</View>

      {/* Become Vendor Banner */}
<TouchableOpacity style={styles.vendorBanner}
   onPress={onNavigateToVendorOnboarding}
   >
  <View style={styles.vendorIcon}>
    <Image
      source={require('../../assets/images/vendoricon.png')}
      style={styles.logOuticon}
      resizeMode="contain"
    />
  </View>
  <View style={styles.vendorContent}>
    <View style={styles.vendorHeader}>
      <Text style={styles.vendorTitle}>Become a vendor today</Text>
      <Text style={styles.vendorArrow}>→</Text>
    </View>
    <Text style={styles.vendorSubtitle}>
      List your cars on Escardia and start making money
    </Text>
  </View>
</TouchableOpacity>

      {/* Menu Items */}
<View style={styles.menuSection}>
  <TouchableOpacity style={styles.menuItem}
    onPress={onNavigateToWallet}
    >
    <View style={styles.iconContainer}>
      <Image
        source={require('../../assets/images/wallet.png')}
        style={styles.logOuticon}
        resizeMode="contain"
      />
    </View>
    <Text style={styles.menuText}>Wallet</Text>
    <Text style={styles.menuArrow}>›</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.menuItem}>
    <View style={styles.iconContainer}>
      <Image
        source={require('../../assets/images/referral.png')}
        style={styles.logOuticon}
        resizeMode="contain"
      />
    </View>
    <Text style={styles.menuText}>Referral</Text>
    <Text style={styles.menuArrow}>›</Text>
  </TouchableOpacity>

  <TouchableOpacity 
    style={styles.menuItem}
    onPress={onNavigateToFavorites}
  >
    <View style={styles.iconContainer}>
      <Image
        source={require('../../assets/images/favouritecar.png')}
        style={styles.logOuticon}
        resizeMode="contain"
      />
    </View>
    <Text style={styles.menuText}>Favourite cars</Text>
    <Text style={styles.menuArrow}>›</Text>
  </TouchableOpacity>
</View>

      {/* Help Section */}
     <View style={styles.sectionHeader}>
  <Text style={styles.sectionTitle}>HELP</Text>
</View>

<View style={styles.menuSection}>
  <TouchableOpacity style={styles.menuItem}
    onPress={onNavigateToSupport}
    >
    <View style={styles.iconContainer}>
      <Image
        source={require('../../assets/images/support.png')}
        style={styles.logOuticon}
        resizeMode="contain"
      />
    </View>
    <Text style={styles.menuText}>Support</Text>
    <Text style={styles.menuArrow}>›</Text>
  </TouchableOpacity>
</View>

      {/* Settings Section */}
     <View style={styles.sectionHeader}>
  <Text style={styles.sectionTitle}>SETTINGS</Text>
</View>

<View style={styles.menuSection}>
  <TouchableOpacity style={styles.menuItem}
    onPress={onNavigateToSecurityLoginSafety}
    >
    <View style={styles.iconContainer}>
      <Image
        source={require('../../assets/images/security.png')}
        style={styles.logOuticon}
        resizeMode="contain"
      />
    </View>
    <Text style={styles.menuText}>Security, Login and Safety</Text>
    <Text style={styles.menuArrow}>›</Text>
  </TouchableOpacity>
</View>

{/* logout section */}
<View style={styles.sectionHeader}>
  <Text style={styles.sectionTitle}>LOGOUT</Text>
</View>

<View style={styles.menuSection}>
  <TouchableOpacity style={styles.menuItem}
    onPress={() => setShowLogoutModal(true)}
    >
    <View style={styles.iconContainer}>
      <Image
        source={require('../../assets/images/logout.png')}
        style={styles.logOuticon}
        resizeMode="contain"
      />
    </View>
    <Text style={styles.menuText}>Logout</Text>
    <Text style={styles.menuArrow}>›</Text>
  </TouchableOpacity>
</View>

      <View style={styles.bottomSpacing} />
    </ScrollView>

    {/* Bottom Navigation */}
    <View style={styles.bottomNav}>
      <TouchableOpacity style={styles.navItem} onPress={onNavigateToHome}>
        <Image
          source={require('../../assets/images/homeicon.png')}
          style={styles.navIcon}
          resizeMode="contain"
        />
        <Text style={styles.navLabel}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={onNavigateToCars}>
        <Image
          source={require('../../assets/images/caricon.png')}
          style={styles.navIcon}
          resizeMode="contain"
        />
        <Text style={styles.navLabel}>Car</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={onNavigateToTrips}>
        <Image
          source={require('../../assets/images/tripicon.png')}
          style={styles.navIcon}
          resizeMode="contain"
        />
        <Text style={styles.navLabel}>Trips</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem}>
        <Image
          source={require('../../assets/images/profileicon.png')}
          style={styles.navIconActive}
          resizeMode="contain"
        />
        <Text style={styles.navLabelActive}>Profile</Text>
      </TouchableOpacity>
    </View>
  
 <LogoutModal
  visible={showLogoutModal}
  onConfirm={async () => {
    try {
      await signOut(auth);
      setShowLogoutModal(false);
      alert('Logged out successfully!');
      onNavigateToWelcome(); // ✅ ADD THIS - need to add this prop
    } catch (error) {
      console.error('Logout error:', error);
      alert('Error logging out');
    }
  }}
  onCancel={() => setShowLogoutModal(false)}
/>
  </View>
);
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

 header: {
    paddingTop: 60,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },

  bottomNav: {
  flexDirection: 'row',
  backgroundColor: colors.background,
  borderTopLeftRadius: borderRadius.xl,
  borderTopRightRadius: borderRadius.xl,
  borderBottomLeftRadius: borderRadius.xl,
  borderBottomRightRadius: borderRadius.xl,
  paddingVertical: spacing.md,
  paddingBottom: 20,
  position: 'absolute',
  bottom: 20,
  left: 20,  
  right: 20,  
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 10,
},

  navItem: {
    flex: 1,
    alignItems: 'center',
  },

  navIcon: {
    width: 24,
    height: 24,
    marginBottom: spacing.xs,
    opacity: 0.5,
  },

  navIconActive: {
    width: 24,
    height: 24,
    marginBottom: spacing.xs,
  },

  navLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },

  navLabelActive: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.semiBold,
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  backArrow: {
    fontSize: 24,
    color: colors.text,
  },

  headerSpacer: {
    width: 40,
  },

  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },

  profileSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },

  profileImageContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },

  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },

  profilePlaceholder: {
    fontSize: 50,
  },

  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
     backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  editIconText: {
    fontSize: 16,
  },

  profileName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },

  profileEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  vendorBanner: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundGray,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },

  vendorIcon: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },

  vendorIconText: {
    fontSize: 24,
  },

  vendorContent: {
    flex: 1,
  },

  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },

  vendorTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    flex: 1,
  },

  vendorArrow: {
    fontSize: typography.fontSize.xl,
    color: colors.text,
  },

  vendorSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.normal * typography.fontSize.sm,
  },

  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },

  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  

  menuSection: {
    backgroundColor: colors.background,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.inputBackground,
    marginBottom: 1,
  },

  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },

  menuIcon: {
    fontSize: 20,
  },

  menuText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },

  menuArrow: {
    fontSize: 24,
    color: colors.textSecondary,
  },

  bottomSpacing: {
    height: 100,
  },
  logOuticon: {
     width: 20,
    height: 20,
  },
 iconContainer: {
  width: 40,
  height: 40,
  borderRadius: 10,
  backgroundColor: colors.background,  // Light red/pink background
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 12,  // This pushes the text away from the icon
},
});


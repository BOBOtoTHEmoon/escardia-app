import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius } from '../constants';

interface ManageDriversScreenProps {
  onNavigateBack: () => void;
  onNavigateToDashboard: () => void;
  onNavigateToFleet: () => void;
  onNavigateToBookings: () => void;
  onNavigateToProfile: () => void;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  licenseNumber: string;
  experience: string;
  status: 'available' | 'busy';
  totalTrips: number;
  rating: number;
  photo?: string;
}

export const ManageDriversScreen: React.FC<ManageDriversScreenProps> = ({
  onNavigateBack,
  onNavigateToDashboard,
  onNavigateToFleet,
  onNavigateToBookings,
  onNavigateToProfile,
}) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [experience, setExperience] = useState('');

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      console.log('🔵 Loading drivers...');
      const { supabase, auth } = await import('../config/supabase');
      const vendorId = auth.currentUser?.uid;
      if (!vendorId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.from('drivers').select('*').eq('vendor_id', vendorId).order('created_at');
      if (error) throw error;
      const driversList = (data ?? []).map((d) => ({
        id: d.id,
        name: d.name,
        phone: d.phone ?? '',
        email: d.email ?? '',
        licenseNumber: d.license_number ?? '',
        experience: d.experience ?? '',
        status: d.status,
        totalTrips: d.total_trips ?? 0,
        rating: Number(d.rating ?? 0),
        photo: d.photo_url ?? undefined,
      })) as Driver[];

      setDrivers(driversList);
      console.log(`✅ Loaded ${driversList.length} drivers`);
    } catch (error) {
      console.error('❌ Error loading drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setLicenseNumber('');
    setExperience('');
    setEditingDriver(null);
  };

  const handleAddDriver = async () => {
    if (!name || !phone || !licenseNumber) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const { supabase, auth } = await import('../config/supabase');
      const vendorId = auth.currentUser?.uid;
      if (!vendorId) return;

      const { error } = await supabase.from('drivers').insert({
        vendor_id: vendorId,
        name,
        phone,
        email,
        license_number: licenseNumber,
        experience,
        status: 'available',
        rating: 5,
      });
      if (error) throw error;

      Alert.alert('Success', 'Driver added successfully!');
      setShowAddModal(false);
      resetForm();
      fetchDrivers();
    } catch (error) {
      console.error('❌ Error adding driver:', error);
      Alert.alert('Error', 'Failed to add driver');
    }
  };

  const handleUpdateDriver = async () => {
    if (!editingDriver || !name || !phone || !licenseNumber) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const { supabase } = await import('../config/supabase');
      const { error } = await supabase
        .from('drivers')
        .update({ name, phone, email, license_number: licenseNumber, experience })
        .eq('id', editingDriver.id);
      if (error) throw error;

      Alert.alert('Success', 'Driver updated successfully!');
      setShowAddModal(false);
      resetForm();
      fetchDrivers();
    } catch (error) {
      console.error('❌ Error updating driver:', error);
      Alert.alert('Error', 'Failed to update driver');
    }
  };

  const handleDeleteDriver = (driver: Driver) => {
    Alert.alert(
      'Delete Driver',
      `Are you sure you want to remove ${driver.name} from your drivers list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { supabase } = await import('../config/supabase');
              const { error } = await supabase.from('drivers').delete().eq('id', driver.id);
              if (error) throw error;
              Alert.alert('Success', 'Driver removed successfully');
              fetchDrivers();
            } catch (error) {
              console.error('❌ Error deleting driver:', error);
              Alert.alert('Error', 'Failed to delete driver');
            }
          },
        },
      ]
    );
  };

  const handleEditDriver = (driver: Driver) => {
    setEditingDriver(driver);
    setName(driver.name);
    setPhone(driver.phone);
    setEmail(driver.email || '');
    setLicenseNumber(driver.licenseNumber);
    setExperience(driver.experience || '');
    setShowAddModal(true);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const getStatusColor = (status: string) => {
    return status === 'available' ? '#10B981' : '#F59E0B';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#2F5FED', '#1E3A8A', '#0F3460']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <Image
            source={require('../../assets/images/headerpattern.png')}
            style={styles.headerPattern}
            resizeMode="cover"
          />
        </LinearGradient>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Manage Drivers</Text>
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Text style={styles.addButtonText}>+ Add Driver</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentWrapper}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Loading drivers...</Text>
            </View>
          ) : drivers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👨‍✈️</Text>
              <Text style={styles.emptyTitle}>No Drivers Yet</Text>
              <Text style={styles.emptyText}>
                Add drivers to manage your with-driver bookings
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={openAddModal}>
                <Text style={styles.emptyButtonText}>Add Your First Driver</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.driversList}>
              {drivers.map((driver) => (
                <View key={driver.id} style={styles.driverCard}>
                  {/* Status Badge */}
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(driver.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {driver.status === 'available' ? 'Available' : 'Busy'}
                    </Text>
                  </View>

                  {/* Driver Info */}
                  <View style={styles.driverHeader}>
                    <View style={styles.driverAvatar}>
                      <Text style={styles.driverAvatarText}>
                        {driver.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.driverInfo}>
                      <Text style={styles.driverName}>{driver.name}</Text>
                      <Text style={styles.driverPhone}>📞 {driver.phone}</Text>
                      {driver.email && (
                        <Text style={styles.driverEmail}>✉️ {driver.email}</Text>
                      )}
                    </View>
                  </View>

                  {/* Driver Details */}
                  <View style={styles.driverDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>License Number</Text>
                      <Text style={styles.detailValue}>{driver.licenseNumber}</Text>
                    </View>
                    {driver.experience && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Experience</Text>
                        <Text style={styles.detailValue}>{driver.experience}</Text>
                      </View>
                    )}
                  </View>

                  {/* Stats */}
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{driver.totalTrips || 0}</Text>
                      <Text style={styles.statLabel}>Trips</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>⭐ {driver.rating?.toFixed(1) || '5.0'}</Text>
                      <Text style={styles.statLabel}>Rating</Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEditDriver(driver)}
                    >
                      <Text style={styles.editButtonText}>✏️ Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteDriver(driver)}
                    >
                      <Text style={styles.deleteButtonText}>🗑️ Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>

      {/* Add/Edit Driver Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingDriver ? 'Edit Driver' : 'Add New Driver'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. John Doe"
                  placeholderTextColor={colors.textSecondary}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 08012345678"
                  placeholderTextColor={colors.textSecondary}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. driver@email.com"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>License Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. LAG123456"
                  placeholderTextColor={colors.textSecondary}
                  value={licenseNumber}
                  onChangeText={setLicenseNumber}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Experience</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 5 years"
                  placeholderTextColor={colors.textSecondary}
                  value={experience}
                  onChangeText={setExperience}
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={editingDriver ? handleUpdateDriver : handleAddDriver}
              >
                <Text style={styles.submitButtonText}>
                  {editingDriver ? 'Update Driver' : 'Add Driver'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={onNavigateToDashboard}>
          <Image
            source={require('../../assets/images/homeicon.png')}
            style={styles.navIcon}
            resizeMode="contain"
          />
          <Text style={styles.navLabel}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={onNavigateToFleet}>
          <Image
            source={require('../../assets/images/caricon.png')}
            style={styles.navIcon}
            resizeMode="contain"
          />
          <Text style={styles.navLabel}>Fleet</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={onNavigateToBookings}>
          <Image
            source={require('../../assets/images/tripicon.png')}
            style={styles.navIcon}
            resizeMode="contain"
          />
          <Text style={styles.navLabel}>Bookings</Text>
        </TouchableOpacity>


        <TouchableOpacity style={styles.navItem} onPress={onNavigateToProfile}>
          <Image
            source={require('../../assets/images/profileicon.png')}
            style={styles.navIcon}
            resizeMode="contain"
          />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  headerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  headerPattern: {
    position: 'absolute',
    width: '80%',
    height: '100%',
    right: -50,
    opacity: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
  },
  addButton: {
    backgroundColor: colors.textWhite,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  addButtonText: {
    color: colors.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
  },
  contentWrapper: {
    flex: 1,
    marginTop: -20,
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  emptyButtonText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
  },
  driversList: {
    gap: spacing.md,
  },
  driverCard: {
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    position: 'relative',
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    zIndex: 10,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    color: colors.textWhite,
    fontWeight: typography.fontWeight.semiBold,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  driverAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  driverAvatarText: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: 4,
  },
  driverPhone: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  driverEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  driverDetails: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  editButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  editButtonText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  modalClose: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitButtonText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
  },
  bottomSpacing: {
    height: 100,
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
});
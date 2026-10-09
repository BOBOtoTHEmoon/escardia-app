import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, spacing, borderRadius } from '../constants';
import { supabase, auth } from '../config/supabase';
import { SearchableDropdown } from '../components/SearchableDropdown';
import { CAR_BRANDS, getModelsForBrand } from '../data/carData';


interface AddCarScreenProps {
  onNavigateBack: () => void;
  onCarAdded: () => void;
}

export interface CarData {
  brand: string;
  model: string;
  year: string;
  type: string;
  pricePerDay: string;
  pricePerHour: string;
  seats: string;
  doors: string;
  transmission: string;
  fuelType: string;
  location: string;
  description: string;
  photos: string[];
}

export const AddCarScreen: React.FC<AddCarScreenProps> = ({
  onNavigateBack,
  onCarAdded,
}) => {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [carType, setCarType] = useState('sedan');
  const [pricePerDay, setPricePerDay] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [seats, setSeats] = useState('');
  const [doors, setDoors] = useState('');
  const [transmission, setTransmission] = useState('automatic');
  const [fuelType, setFuelType] = useState('petrol');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ NEW
  const [showSuccessModal, setShowSuccessModal] = useState(false); // ✅ NEW

  const [vendorStatus, setVendorStatus] = useState<'checking' | 'pending' | 'approved' | 'rejected'>('checking');
  const [modelOptions, setModelOptions] = useState<string[]>([]);

  useEffect(() => {
    checkVendorApprovalStatus();
  }, []);

  useEffect(() => {
  if (brand) {
    const models = getModelsForBrand(brand);
    setModelOptions(models);
  } else {
    setModelOptions([]);
  }
}, [brand]);

  const checkVendorApprovalStatus = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please login first');
        onNavigateBack();
        return;
      }

      const { data: vendorRow } = await supabase.from('vendors').select('status').eq('id', user.uid).maybeSingle();

      if (vendorRow) {
        const status = vendorRow.status || 'pending';
        setVendorStatus(status);
        
        if (status === 'rejected') {
          Alert.alert(
            'Account Rejected',
            'Your vendor application was rejected. Please contact support.',
            [{ text: 'OK', onPress: onNavigateBack }]
          );
        }
      } else {
        Alert.alert(
          'Not a Vendor',
          'Please complete vendor registration first.',
          [{ text: 'OK', onPress: onNavigateBack }]
        );
        setVendorStatus('pending');
      }
    } catch (error) {
      console.error('Error checking vendor status:', error);
      setVendorStatus('pending');
    }
  };

  // ✅ CHECKING SCREEN (shows while loading)
  if (vendorStatus === 'checking') {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Checking account status...</Text>
        </View>
      </View>
    );
  }

  // ✅ PENDING SCREEN (shows if vendor not approved)
  if (vendorStatus === 'pending') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
            <Text style={{ fontSize: 24 }}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Car</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.pendingContainer}>
          <Text style={styles.pendingIcon}>⏳</Text>
          <Text style={styles.pendingTitle}>Approval Pending</Text>
          <Text style={styles.pendingMessage}>
            Your vendor account is currently under review by our team.
          </Text>
          <Text style={styles.pendingNote}>
            You'll be able to add cars once your account is approved. This usually takes 24-48 hours.
          </Text>
          <Text style={styles.pendingNote2}>
            We'll send you a notification once you're approved! 🎉
          </Text>
          <TouchableOpacity 
            style={styles.pendingButton}
            onPress={onNavigateBack}
          >
            <Text style={styles.pendingButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const carTypes = ['sedan', 'suv', 'luxury', 'exotic', 'van', 'truck'];
  const transmissionTypes = ['automatic', 'manual'];
  const fuelTypes = ['petrol', 'diesel', 'electric', 'hybrid'];

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required');
      return false;
    }
    return true;
  };

  const handleAddPhoto = async (type: 'camera' | 'gallery') => {
    if (photos.length >= 5) {
      Alert.alert('Limit reached', 'You can add up to 5 photos');
      return;
    }

    let result;
    if (type === 'camera') {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
    }

    if (!result.canceled && result.assets[0]) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const showPhotoOptions = () => {
    Alert.alert('Add Car Photo', 'Choose an option', [
      { text: 'Take Photo', onPress: () => handleAddPhoto('camera') },
      { text: 'Choose from Gallery', onPress: () => handleAddPhoto('gallery') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!brand.trim()) newErrors.brand = 'Brand is required';
    if (!model.trim()) newErrors.model = 'Model is required';
    if (!year.trim()) newErrors.year = 'Year is required';
    if (!pricePerDay.trim()) newErrors.pricePerDay = 'Price per day is required';
    if (!pricePerHour.trim()) newErrors.pricePerHour = 'Price per hour is required';
    if (!seats.trim()) newErrors.seats = 'Number of seats is required';
    if (!doors.trim()) newErrors.doors = 'Number of doors is required';
    if (!location.trim()) newErrors.location = 'Location is required';
    if (photos.length === 0) newErrors.photos = 'At least one photo is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true); // ✅ Show loading


    try {
      const vendorId = auth.currentUser?.uid;

      if (!vendorId) {
        Alert.alert('Error', 'You must be logged in to add a car');
        setIsSubmitting(false);
        return;
      }

      // Photos are uploaded to Supabase Storage inside addCar().
      const photoUrls: string[] = photos;

      const carData = {
        brand,
        model,
        year,
        type: carType,
        pricePerDay: Number(pricePerDay),
        pricePerHour: Number(pricePerHour),
        seats: Number(seats),
        doors: Number(doors),
        transmission,
        fuelType,
        location,
        description,
        photos: photoUrls,
      };

      const { addCar } = await import('../services/carservice');
      const result = await addCar(carData, vendorId);

      setIsSubmitting(false); // ✅ Hide loading

      if (result.success) {
        console.log('✅ Car added! ID:', result.carId);
        console.log('⏳ Car is pending admin approval');
        
        // ✅ Show success modal instead of basic alert
        setShowSuccessModal(true);
      } else {
        Alert.alert('Error', result.error || 'Failed to add car');
      }
    } catch (error) {
      console.error('❌ Error adding car:', error);
      setIsSubmitting(false);
      Alert.alert('Error', 'Failed to add car. Please try again.');
    }
  };

  // ✅ Handle success modal close
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    onCarAdded();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Car</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Photos Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Car Photos *</Text>
          <Text style={styles.sectionSubtitle}>Add up to 5 photos (clear, well-lit images help get approved faster)</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri: photo }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => handleRemovePhoto(index)}
                >
                  <Text style={styles.removePhotoText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 5 && (
              <TouchableOpacity style={styles.addPhotoButton} onPress={showPhotoOptions}>
                <Text style={styles.addPhotoIcon}>📷</Text>
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
          {errors.photos && <Text style={styles.errorText}>{errors.photos}</Text>}
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <SearchableDropdown
  label="Brand *"
  placeholder="Select or type brand..."
  value={brand}
  onSelect={setBrand}
  options={CAR_BRANDS}
  error={errors.brand}
  allowCustom={true}
/>

<SearchableDropdown
  label="Model *"
  placeholder={brand ? "Select or type model..." : "Select brand first..."}
  value={model}
  onSelect={setModel}
  options={modelOptions}
  error={errors.model}
  allowCustom={true}
/>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Year *</Text>
            <TextInput
              style={[styles.input, errors.year && styles.inputError]}
              placeholder="e.g. 2024"
              placeholderTextColor={colors.textSecondary}
              value={year}
              onChangeText={setYear}
              keyboardType="number-pad"
              maxLength={4}
            />
            {errors.year && <Text style={styles.errorText}>{errors.year}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Car Type *</Text>
            <View style={styles.chipsContainer}>
              {carTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.chip, carType === type && styles.chipActive]}
                  onPress={() => setCarType(type)}
                >
                  <Text style={[styles.chipText, carType === type && styles.chipTextActive]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Price per Day (₦) *</Text>
              <TextInput
                style={[styles.input, errors.pricePerDay && styles.inputError]}
                placeholder="85000"
                placeholderTextColor={colors.textSecondary}
                value={pricePerDay}
                onChangeText={setPricePerDay}
                keyboardType="number-pad"
              />
              {errors.pricePerDay && <Text style={styles.errorText}>{errors.pricePerDay}</Text>}
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Price per Hour (₦) *</Text>
              <TextInput
                style={[styles.input, errors.pricePerHour && styles.inputError]}
                placeholder="10625"
                placeholderTextColor={colors.textSecondary}
                value={pricePerHour}
                onChangeText={setPricePerHour}
                keyboardType="number-pad"
              />
              {errors.pricePerHour && <Text style={styles.errorText}>{errors.pricePerHour}</Text>}
            </View>
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Seats *</Text>
              <TextInput
                style={[styles.input, errors.seats && styles.inputError]}
                placeholder="4"
                placeholderTextColor={colors.textSecondary}
                value={seats}
                onChangeText={setSeats}
                keyboardType="number-pad"
              />
              {errors.seats && <Text style={styles.errorText}>{errors.seats}</Text>}
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Doors *</Text>
              <TextInput
                style={[styles.input, errors.doors && styles.inputError]}
                placeholder="4"
                placeholderTextColor={colors.textSecondary}
                value={doors}
                onChangeText={setDoors}
                keyboardType="number-pad"
              />
              {errors.doors && <Text style={styles.errorText}>{errors.doors}</Text>}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Transmission *</Text>
            <View style={styles.chipsContainer}>
              {transmissionTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.chip, transmission === type && styles.chipActive]}
                  onPress={() => setTransmission(type)}
                >
                  <Text style={[styles.chipText, transmission === type && styles.chipTextActive]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fuel Type *</Text>
            <View style={styles.chipsContainer}>
              {fuelTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.chip, fuelType === type && styles.chipActive]}
                  onPress={() => setFuelType(type)}
                >
                  <Text style={[styles.chipText, fuelType === type && styles.chipTextActive]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pickup Location *</Text>
            <TextInput
              style={[styles.input, errors.location && styles.inputError]}
              placeholder="Enter pickup address"
              placeholderTextColor={colors.textSecondary}
              value={location}
              onChangeText={setLocation}
              multiline
            />
            {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description (Optional)</Text>

          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell customers about this car, special features, condition, etc."
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* ✅ Info Box about approval */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Your car will be reviewed by our team before it appears to customers. This usually takes 24-48 hours.
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <View style={styles.submitButtonContent}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.submitButtonText}>  Adding Car...</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>Add Car to Fleet</Text>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* ✅ SUCCESS MODAL - Shows after car is added */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleSuccessModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalIcon}>🎉</Text>
            <Text style={styles.modalTitle}>Car Added Successfully!</Text>
            <Text style={styles.modalMessage}>
              Your {brand} {model} has been submitted for review.
            </Text>
            
            <View style={styles.modalInfoBox}>
              <Text style={styles.modalInfoTitle}>⏳ What happens next?</Text>
              <Text style={styles.modalInfoText}>
                • Our team will review your car listing{'\n'}
                • This usually takes 24-48 hours{'\n'}
                • You'll be notified once approved{'\n'}
                • Then your car will be visible to customers
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleSuccessModalClose}
            >
              <Text style={styles.modalButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  backButton: {
    padding: spacing.sm,
  },
  backIcon: {
    fontSize: 24,
    color: colors.text,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  photosScroll: {
    marginBottom: spacing.sm,
  },
  photoContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  photo: {
    width: 150,
    height: 100,
    borderRadius: borderRadius.md,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  addPhotoButton: {
    width: 150,
    height: 100,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
  },
  addPhotoIcon: {
    fontSize: 30,
    marginBottom: spacing.xs,
  },
  addPhotoText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: '#EF4444',
    marginTop: spacing.xs,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.inputBackground,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semiBold,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  // ✅ NEW: Info box styles
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: '#1E40AF',
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitButtonDisabled: {
    backgroundColor: colors.primary + '80',
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
  },
  bottomSpacing: {
    height: 40,
  },
  // Loading & Pending styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  pendingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#fff',
  },
  pendingIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  pendingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  pendingMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  pendingNote: {
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  pendingNote2: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  pendingButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
  },
  pendingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // ✅ NEW: Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInfoBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 20,
  },
  modalInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  modalInfoText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
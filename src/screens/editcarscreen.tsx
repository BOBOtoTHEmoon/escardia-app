import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, spacing, borderRadius } from '../constants';

interface EditCarScreenProps {
  onNavigateBack: () => void;
  carId: string;
  onSaveSuccess: () => void;
}

export const EditCarScreen: React.FC<EditCarScreenProps> = ({
  onNavigateBack,
  carId,
  onSaveSuccess,
}) => {
  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form fields
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [type, setType] = useState('');
  const [pricePerDay, setPricePerDay] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [seats, setSeats] = useState('');
  const [doors, setDoors] = useState('');
  const [transmission, setTransmission] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<string[]>([]);

  useEffect(() => {
    fetchCarDetails();
  }, [carId]);

  const fetchCarDetails = async () => {
    try {
      const { db } = await import('../config/firebase');
      const { doc, getDoc } = await import('firebase/firestore');

      const carDoc = await getDoc(doc(db, 'cars', carId));
      
      if (carDoc.exists()) {
        const carData = carDoc.data();
        setCar(carData);
        
        // Populate form
        setBrand(carData.brand || '');
        setModel(carData.model || '');
        setYear(carData.year?.toString() || '');
        setType(carData.type || '');
        setPricePerDay(carData.pricePerDay?.toString() || '');
        setPricePerHour(carData.pricePerHour?.toString() || '');
        setSeats(carData.seats?.toString() || '');
        setDoors(carData.doors?.toString() || '');
        setTransmission(carData.transmission || '');
        setFuelType(carData.fuelType || '');
        setLocation(carData.location || '');
        setDescription(carData.description || '');
        setPhotos(carData.photos || []);
      }
    } catch (error) {
      console.error('Error loading car:', error);
      Alert.alert('Error', 'Failed to load car details');
    } finally {
      setLoading(false);
    }
  };

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const uris = result.assets.map(asset => asset.uri);
        setNewPhotos([...newPhotos, ...uris]);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const removePhoto = (index: number, isNew: boolean) => {
    if (isNew) {
      setNewPhotos(newPhotos.filter((_, i) => i !== index));
    } else {
      setPhotos(photos.filter((_, i) => i !== index));
    }
  };

  const uploadImagesToCloudinary = async (imageUris: string[]) => {
    const uploadedUrls: string[] = [];

    for (const uri of imageUris) {
      try {
        const formData = new FormData();
        formData.append('file', {
          uri,
          type: 'image/jpeg',
          name: 'car-photo.jpg',
        } as any);
        formData.append('upload_preset', 'escardia');

        const response = await fetch(
          'https://api.cloudinary.com/v1_1/dsrd8cgse/image/upload',
          {
            method: 'POST',
            body: formData,
          }
        );

        const data = await response.json();
        if (data.secure_url) {
          uploadedUrls.push(data.secure_url);
        }
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }

    return uploadedUrls;
  };

  const handleSave = async () => {
    // Validation
    if (!brand || !model || !year || !pricePerDay || !location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setSaving(true);

    try {
      // Upload new photos if any
      let allPhotos = [...photos];
      if (newPhotos.length > 0) {
        const uploadedUrls = await uploadImagesToCloudinary(newPhotos);
        allPhotos = [...allPhotos, ...uploadedUrls];
      }

      // Update Firestore
      const { db } = await import('../config/firebase');
      const { doc, updateDoc } = await import('firebase/firestore');

      await updateDoc(doc(db, 'cars', carId), {
        brand,
        model,
        year: parseInt(year),
        type,
        pricePerDay: parseInt(pricePerDay),
        pricePerHour: parseInt(pricePerHour),
        seats: parseInt(seats),
        doors: parseInt(doors),
        transmission,
        fuelType,
        location,
        description,
        photos: allPhotos,
        updatedAt: new Date().toISOString(),
      });

      Alert.alert('Success', 'Car updated successfully!', [
        { text: 'OK', onPress: onSaveSuccess },
      ]);
    } catch (error) {
      console.error('Error updating car:', error);
      Alert.alert('Error', 'Failed to update car');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Car</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Car</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Photos Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📸 Photos</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.photosContainer}>
              {/* Existing photos */}
              {photos.map((photo, index) => (
                <View key={`existing-${index}`} style={styles.photoWrapper}>
                  <Image source={{ uri: photo }} style={styles.photo} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto(index, false)}
                  >
                    <Text style={styles.removePhotoText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* New photos */}
              {newPhotos.map((photo, index) => (
                <View key={`new-${index}`} style={styles.photoWrapper}>
                  <Image source={{ uri: photo }} style={styles.photo} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto(index, true)}
                  >
                    <Text style={styles.removePhotoText}>✕</Text>
                  </TouchableOpacity>
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                </View>
              ))}

              {/* Add photo button */}
              <TouchableOpacity style={styles.addPhotoButton} onPress={pickImages}>
                <Text style={styles.addPhotoIcon}>+</Text>
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚗 Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Brand *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Toyota, Mercedes"
              value={brand}
              onChangeText={setBrand}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Model *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Camry, S-Class"
              value={model}
              onChangeText={setModel}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Year *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 2024"
              value={year}
              onChangeText={setYear}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Type</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., SUV, Sedan, Coupe"
              value={type}
              onChangeText={setType}
            />
          </View>
        </View>

        {/* Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Pricing</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Price Per Day (₦) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 50000"
              value={pricePerDay}
              onChangeText={setPricePerDay}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Price Per Hour (₦)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 5000"
              value={pricePerHour}
              onChangeText={setPricePerHour}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Specifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 Specifications</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Seats</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 5"
              value={seats}
              onChangeText={setSeats}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Doors</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 4"
              value={doors}
              onChangeText={setDoors}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Transmission</Text>
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={[
                  styles.optionChip,
                  transmission === 'automatic' && styles.optionChipActive,
                ]}
                onPress={() => setTransmission('automatic')}
              >
                <Text
                  style={[
                    styles.optionText,
                    transmission === 'automatic' && styles.optionTextActive,
                  ]}
                >
                  Automatic
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionChip,
                  transmission === 'manual' && styles.optionChipActive,
                ]}
                onPress={() => setTransmission('manual')}
              >
                <Text
                  style={[
                    styles.optionText,
                    transmission === 'manual' && styles.optionTextActive,
                  ]}
                >
                  Manual
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fuel Type</Text>
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={[
                  styles.optionChip,
                  fuelType === 'petrol' && styles.optionChipActive,
                ]}
                onPress={() => setFuelType('petrol')}
              >
                <Text
                  style={[
                    styles.optionText,
                    fuelType === 'petrol' && styles.optionTextActive,
                  ]}
                >
                  Petrol
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionChip,
                  fuelType === 'diesel' && styles.optionChipActive,
                ]}
                onPress={() => setFuelType('diesel')}
              >
                <Text
                  style={[
                    styles.optionText,
                    fuelType === 'diesel' && styles.optionTextActive,
                  ]}
                >
                  Diesel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionChip,
                  fuelType === 'electric' && styles.optionChipActive,
                ]}
                onPress={() => setFuelType('electric')}
              >
                <Text
                  style={[
                    styles.optionText,
                    fuelType === 'electric' && styles.optionTextActive,
                  ]}
                >
                  Electric
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Location</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pickup Location *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter pickup address"
              value={location}
              onChangeText={setLocation}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Description</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Car Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your car..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.textWhite} />
            ) : (
              <Text style={styles.saveButtonText}>💾 Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
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
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  photosContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  photoWrapper: {
    position: 'relative',
  },
  photo: {
    width: 120,
    height: 120,
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
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
  },
  newBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  newBadgeText: {
    color: colors.textWhite,
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
  },
  addPhotoButton: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
  },
  addPhotoIcon: {
    fontSize: 40,
    color: colors.textSecondary,
  },
  addPhotoText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
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
    borderColor: colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  optionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundGray,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  optionTextActive: {
    color: colors.textWhite,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
  },
  bottomSpacing: {
    height: 40,
  },
});
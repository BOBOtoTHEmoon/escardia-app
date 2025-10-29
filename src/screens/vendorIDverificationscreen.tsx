import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, spacing, borderRadius } from '../constants';

interface VendorIDVerificationScreenProps {
  onComplete: (data: IDVerificationData) => void;
  onNavigateBack: () => void;
}

export interface IDVerificationData {
  nin: string;
  idType: 'national-id' | 'passport' | 'voters-card';
  idFront: string;
  idBack: string;
  proofOfAddress: string | null;
}

export const VendorIDVerificationScreen: React.FC<VendorIDVerificationScreenProps> = ({
  onComplete,
  onNavigateBack,
}) => {
  const [nin, setNin] = useState('');
  const [idType, setIdType] = useState<'national-id' | 'passport' | 'voters-card'>('national-id');
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [proofOfAddress, setProofOfAddress] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
      return false;
    }
    return true;
  };

  const handleImagePicker = async (
    type: 'camera' | 'gallery',
    setter: (uri: string) => void
  ) => {
    let result;

    if (type === 'camera') {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return;

      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
    }

    if (!result.canceled && result.assets[0]) {
      setter(result.assets[0].uri);
    }
  };

  const showImagePickerOptions = (setter: (uri: string) => void) => {
    Alert.alert('Upload Photo', 'Choose an option', [
      { text: 'Take Photo', onPress: () => handleImagePicker('camera', setter) },
      { text: 'Choose from Gallery', onPress: () => handleImagePicker('gallery', setter) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!nin.trim()) {
      newErrors.nin = 'NIN is required';
    } else if (nin.length !== 11) {
      newErrors.nin = 'NIN must be 11 digits';
    }

    if (!idFront) {
      newErrors.idFront = 'ID front photo is required';
    }

    if (!idBack) {
      newErrors.idBack = 'ID back photo is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      onComplete({
        nin,
        idType,
        idFront: idFront!,
        idBack: idBack!,
        proofOfAddress,
      });
    }
  };

  const renderIDTypeSelector = () => (
    <View style={styles.idTypeContainer}>
      <TouchableOpacity
        style={[styles.idTypeButton, idType === 'national-id' && styles.idTypeButtonActive]}
        onPress={() => setIdType('national-id')}
      >
        <Text style={[styles.idTypeText, idType === 'national-id' && styles.idTypeTextActive]}>
          National ID
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.idTypeButton, idType === 'passport' && styles.idTypeButtonActive]}
        onPress={() => setIdType('passport')}
      >
        <Text style={[styles.idTypeText, idType === 'passport' && styles.idTypeTextActive]}>
          Passport
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.idTypeButton, idType === 'voters-card' && styles.idTypeButtonActive]}
        onPress={() => setIdType('voters-card')}
      >
        <Text style={[styles.idTypeText, idType === 'voters-card' && styles.idTypeTextActive]}>
          Voter's Card
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderUploadBox = (
    label: string,
    image: string | null,
    onPress: () => void,
    error?: string
  ) => (
    <View style={styles.uploadGroup}>
      <Text style={styles.uploadLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.uploadBox, error && styles.uploadBoxError]}
        onPress={onPress}
      >
        {image ? (
          <Image source={{ uri: image }} style={styles.uploadedPhoto} resizeMode="cover" />
        ) : (
          <View style={styles.uploadPlaceholder}>
            <View style={styles.cameraIcon}>
              <Text style={styles.cameraIconText}>📷</Text>
            </View>
            <Text style={styles.uploadHint}>
              Add/take a picture or scan of the {label.toLowerCase()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.placeholder} />
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressStep, styles.progressStepActive]} />
            <View style={[styles.progressLine, styles.progressLineActive]} />
            <View style={[styles.progressStep, styles.progressStepActive]} />
            <View style={[styles.progressLine, styles.progressLineActive]} />
            <View style={[styles.progressStep, styles.progressStepActive]} />
            <View style={[styles.progressLine, styles.progressLineActive]} />
            <View style={[styles.progressStep, styles.progressStepActive]} />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>ID Verification</Text>

        {/* Form */}
        <View style={styles.form}>
          {/* NIN */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>NIN</Text>
            <TextInput
              style={[styles.input, errors.nin && styles.inputError]}
              placeholder="Enter your 11-digit NIN"
              placeholderTextColor={colors.textSecondary}
              value={nin}
              onChangeText={setNin}
              keyboardType="number-pad"
              maxLength={11}
            />
            {errors.nin && <Text style={styles.errorText}>{errors.nin}</Text>}
          </View>

          {/* ID Type Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Government ID Type</Text>
            {renderIDTypeSelector()}
          </View>

          {/* ID Front Upload */}
          {renderUploadBox(
            `${idType === 'national-id' ? 'National ID' : idType === 'passport' ? 'Passport' : "Voter's Card"} (Front)`,
            idFront,
            () => showImagePickerOptions(setIdFront),
            errors.idFront
          )}

          {/* ID Back Upload */}
          {renderUploadBox(
            `${idType === 'national-id' ? 'National ID' : idType === 'passport' ? 'Passport' : "Voter's Card"} (Back)`,
            idBack,
            () => showImagePickerOptions(setIdBack),
            errors.idBack
          )}

          {/* Proof of Address (Optional) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Proof of Address{' '}
              <Text style={styles.optionalText}>(optional)</Text>
            </Text>
            <Text style={styles.helperText}>
              Utility bill, bank statement, or any document with your address
            </Text>
            <TouchableOpacity
              style={styles.uploadBox}
              onPress={() => showImagePickerOptions(setProofOfAddress)}
            >
              {proofOfAddress ? (
                <Image
                  source={{ uri: proofOfAddress }}
                  style={styles.uploadedPhoto}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <View style={styles.cameraIcon}>
                    <Text style={styles.cameraIconText}>📷</Text>
                  </View>
                  <Text style={styles.uploadHint}>
                    Add/take a picture of proof of address
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: spacing.lg,
  },
  backButton: {
    padding: spacing.sm,
  },
  backIcon: {
    fontSize: 24,
    color: colors.text,
  },
  logo: {
    width: 40,
    height: 40,
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    marginBottom: spacing.xl,
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStep: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  progressStepActive: {
    backgroundColor: colors.primary,
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
  },
  progressLineActive: {
    backgroundColor: colors.primary,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  form: {
    gap: spacing.xl,
    marginBottom: spacing.xl,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  optionalText: {
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.regular,
  },
  helperText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
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
  errorText: {
    fontSize: typography.fontSize.xs,
    color: '#EF4444',
    marginTop: spacing.xs,
  },
  idTypeContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  idTypeButton: {
    flex: 1,
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  idTypeButtonActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  idTypeText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  idTypeTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semiBold,
  },
  uploadGroup: {
    gap: spacing.xs,
  },
  uploadLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  uploadBox: {
    backgroundColor: colors.inputBackground,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    minHeight: 150,
  },
  uploadBoxError: {
    borderColor: '#EF4444',
  },
  uploadPlaceholder: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  cameraIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cameraIconText: {
    fontSize: 24,
  },
  uploadHint: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  uploadedPhoto: {
    width: '100%',
    height: 150,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  continueButtonText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
  },
});
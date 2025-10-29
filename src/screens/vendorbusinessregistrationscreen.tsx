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

interface VendorBusinessRegistrationScreenProps {
  onContinue: (data: BusinessRegistrationData) => void;
  onNavigateBack: () => void;
}

export interface BusinessRegistrationData {
  businessName: string;
  cacCertificate: string | null;
}

export const VendorBusinessRegistrationScreen: React.FC<VendorBusinessRegistrationScreenProps> = ({
  onContinue,
  onNavigateBack,
}) => {
  const [businessName, setBusinessName] = useState('');
  const [cacCertificate, setCacCertificate] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
      return false;
    }
    return true;
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCacCertificate(result.assets[0].uri);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCacCertificate(result.assets[0].uri);
    }
  };

  const handleCACUpload = () => {
    Alert.alert(
      'Upload CAC Certificate',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: handleTakePhoto },
        { text: 'Choose from Gallery', onPress: handlePickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      onContinue({
        businessName,
        cacCertificate,
      });
    }
  };

  const handleSkipCAC = () => {
    if (!businessName.trim()) {
      setErrors({ businessName: 'Business name is required' });
      return;
    }

    Alert.alert(
      'Skip CAC Registration?',
      'You can add your CAC certificate later in your profile settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            onContinue({
              businessName,
              cacCertificate: null,
            });
          },
        },
      ]
    );
  };

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
            <View style={styles.progressLine} />
            <View style={styles.progressStep} />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Business Registration</Text>

        {/* Form */}
        <View style={styles.form}>
          {/* Business Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business name</Text>
            <TextInput
              style={[styles.input, errors.businessName && styles.inputError]}
              placeholder="Enter your business name"
              placeholderTextColor={colors.textSecondary}
              value={businessName}
              onChangeText={setBusinessName}
              autoCapitalize="words"
            />
            {errors.businessName && (
              <Text style={styles.errorText}>{errors.businessName}</Text>
            )}
          </View>

          {/* CAC Registration (Optional) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              CAC registration{' '}
              <Text style={styles.optionalText}>(optional)</Text>
            </Text>

            <TouchableOpacity
              style={styles.uploadContainer}
              onPress={handleCACUpload}
            >
              {cacCertificate ? (
                <View style={styles.uploadedImageContainer}>
                  <Image
                    source={{ uri: cacCertificate }}
                    style={styles.uploadedImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.changeImageButton}
                    onPress={handleCACUpload}
                  >
                    <Text style={styles.changeImageText}>Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <View style={styles.cameraIcon}>
                    <Text style={styles.cameraIconText}>📷</Text>
                  </View>
                  <Text style={styles.uploadText}>
                    Add/take a picture or scan of CAC certificate
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSkipCAC} style={styles.skipLink}>
              <Text style={styles.skipLinkText}>
                Skip for now (You can add this later)
              </Text>
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
  uploadContainer: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  uploadPlaceholder: {
    backgroundColor: colors.inputBackground,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  cameraIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cameraIconText: {
    fontSize: 30,
  },
  uploadText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  uploadedImageContainer: {
    position: 'relative',
  },
  uploadedImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
  },
  changeImageButton: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  changeImageText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
  },
  skipLink: {
    marginTop: spacing.sm,
  },
  skipLinkText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    textAlign: 'center',
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
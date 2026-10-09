import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  Linking,
  Alert,
} from 'react-native';
import { Button, Input, SocialButton } from '../components';
import { colors, typography, spacing } from '../constants';
import { signUpWithEmail } from '../services/authservice';
// ✅ Import for Google Sign In (install: npx expo install expo-auth-session expo-crypto)
// import * as Google from 'expo-auth-session/providers/google';
// import * as AppleAuthentication from 'expo-apple-authentication';


interface SignUpScreenProps {
    onSignUpSuccess: (email: string, needsVerification: boolean) => void;
  onNavigateToSignIn: () => void;
  onNavigateBack: () => void; 
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onSignUpSuccess,
  onNavigateToSignIn,
  onNavigateBack,
}) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Terms & Conditions state
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    terms: '',
  });

  // Validate email
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate password (min 8 chars, at least 1 number, 1 special char)
  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return minLength && hasNumber && hasSpecialChar;
  };

  // Handle Sign Up
  const handleSignUp = async () => {
    // Clear previous errors
    setErrors({
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
      terms: '',
    });

    let isValid = true;
    const newErrors = { ...errors };

    // Validate email
    if (!email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
      isValid = false;
    }

    // Validate first name
    if (!firstName) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    }

    // Validate last name
    if (!lastName) {
      newErrors.lastName = 'Last name is required';
      isValid = false;
    }

    // Validate password
    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (!validatePassword(password)) {
      newErrors.password = 'Password must be 8+ chars with number & special char';
      isValid = false;
    }

    // Validate confirm password
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    // Validate terms agreement
    if (!agreedToTerms) {
      newErrors.terms = 'You must agree to the Terms & Conditions';
      isValid = false;
    }

    if (!isValid) {
      setErrors(newErrors);
      return;
    }

    // Sign up with Firebase
    setLoading(true);
    const result = await signUpWithEmail(email, password, firstName, lastName);
    setLoading(false);

    if (result.success) {
            onSignUpSuccess(email.trim().toLowerCase(), result.needsVerification !== false);
    } else {
      newErrors.email = result.error || 'Sign up failed. Please try again.';
      setErrors(newErrors);
    }
  };

  // ✅ Handle Google Sign Up
  const handleGoogleSignUp = async () => {
    // TODO: Implement Google Sign In
    // 1. Install: npx expo install expo-auth-session expo-crypto
    // 2. Configure Google Cloud Console
    // 3. Add Google OAuth credentials
    Alert.alert(
      'Coming Soon',
      'Google Sign In will be available soon!',
      [{ text: 'OK' }]
    );
    
    /* 
    // Example implementation:
    const [request, response, promptAsync] = Google.useAuthRequest({
      expoClientId: 'YOUR_EXPO_CLIENT_ID',
      iosClientId: 'YOUR_IOS_CLIENT_ID',
      androidClientId: 'YOUR_ANDROID_CLIENT_ID',
    });

    if (response?.type === 'success') {
      const { authentication } = response;
      // Sign in with Firebase using Google credential
    }
    */
  };

  // ✅ Handle Apple Sign Up
  const handleAppleSignUp = async () => {
    // TODO: Implement Apple Sign In
    // 1. Install: npx expo install expo-apple-authentication
    // 2. Configure Apple Developer Account
    // 3. Enable Sign In with Apple capability
    Alert.alert(
      'Coming Soon',
      'Apple Sign In will be available soon!',
      [{ text: 'OK' }]
    );

    /*
    // Example implementation:
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      // Sign in with Firebase using Apple credential
    } catch (e) {
      console.error(e);
    }
    */
  };

  // Open external link
  const openExternalLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Error opening URL:', err));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Sign Up</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email Input - Full Width */}
          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          {/* First Name and Last Name - Side by Side */}
          <View style={styles.nameRow}>
            <View style={styles.nameInputContainer}>
              <Input
                label="First Name"
                placeholder="First Name"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                error={errors.firstName}
              />
            </View>
            <View style={styles.nameInputContainer}>
              <Input
                label="Last Name"
                placeholder="Last Name"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                error={errors.lastName}
              />
            </View>
          </View>

          {/* Password Input */}
          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            isPassword
            error={errors.password}
          />

          {/* Confirm Password Input */}
          <Input
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
            error={errors.confirmPassword}
          />

          {/* Terms & Conditions Checkbox */}
          <View style={styles.termsContainer}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text 
                  style={styles.termsLink} 
                  onPress={() => setShowTermsModal(true)}
                >
                  Terms & Conditions
                </Text>
                {' '}and{' '}
                <Text 
                  style={styles.termsLink} 
                  onPress={() => openExternalLink('https://www.escardia.com/privacy')}
                >
                  Privacy Policy
                </Text>
              </Text>
            </TouchableOpacity>
            {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}
          </View>

          {/* Sign Up Button */}
          <Button
            title="Sign Up"
            onPress={handleSignUp}
            loading={loading}
            style={styles.signUpButton}
          />

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Sign Up - ✅ CLOSER SPACING */}
          <View style={styles.socialContainer}>
            <SocialButton
              provider="apple"
              onPress={handleAppleSignUp}
            />
            <View style={styles.socialGap} />
            <SocialButton
              provider="google"
              onPress={handleGoogleSignUp}
            />
          </View>

          {/* Sign In Link - ✅ BETTER POSITIONING */}
          <TouchableOpacity
            onPress={onNavigateToSignIn}
            style={styles.signInContainer}
          >
            <Text style={styles.signInText}>
              Already have an account?{' '}
              <Text style={styles.signInLink}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Terms & Conditions Modal */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Terms & Conditions</Text>
            <TouchableOpacity 
              onPress={() => setShowTermsModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalSectionTitle}>1. Acceptance of Terms</Text>
            <Text style={styles.modalText}>
              By accessing and using the Escardia mobile application ("App"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
            </Text>

            <Text style={styles.modalSectionTitle}>2. Eligibility</Text>
            <Text style={styles.modalText}>
              You must be at least 18 years old and possess a valid driver's license to rent a vehicle through Escardia. By using our services, you confirm that you meet these requirements.
            </Text>

            <Text style={styles.modalSectionTitle}>3. Account Registration</Text>
            <Text style={styles.modalText}>
              You agree to provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
            </Text>

            <Text style={styles.modalSectionTitle}>4. Booking and Payments</Text>
            <Text style={styles.modalText}>
              • All bookings are subject to vehicle availability{'\n'}
              • Prices displayed include platform fees{'\n'}
              • Payment must be made in full before the rental period begins{'\n'}
              • Cancellation policies vary by vendor; please review before booking{'\n'}
              • Escardia charges a 10% service fee on all transactions
            </Text>

            <Text style={styles.modalSectionTitle}>5. Vehicle Use</Text>
            <Text style={styles.modalText}>
              • Vehicles must be used in accordance with Nigerian traffic laws{'\n'}
              • Smoking, pets, and illegal activities are prohibited in rental vehicles{'\n'}
              • You are responsible for any damage during your rental period{'\n'}
              • Vehicles must be returned in the same condition as received{'\n'}
              • Late returns may incur additional charges
            </Text>

            <Text style={styles.modalSectionTitle}>6. Contact Us</Text>
            <Text style={styles.modalText}>
              For questions about these Terms & Conditions, please contact us at:{'\n\n'}
              Email: support@escardia.com{'\n'}
              Website: www.escardia.com
            </Text>

            <Text style={styles.modalLastUpdated}>
              Last updated: December 2024
            </Text>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalAcceptButton}
              onPress={() => {
                setAgreedToTerms(true);
                setShowTermsModal(false);
              }}
            >
              <Text style={styles.modalAcceptButtonText}>I Accept</Text>
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
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: 50,
    paddingBottom: 30, // ✅ Added bottom padding
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: -70,
  },
  logo: {
    width: 50,
    height: 85,
    marginTop: spacing['2xl'],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: 0,
  },
  form: {
    flex: 1,
  },
  signUpButton: {
    marginTop: spacing.md,
  },
  
  // ✅ FIXED: Divider styles
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  // ✅ FIXED: Social buttons closer together
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialGap: {
    width: spacing.md, // Gap between buttons
  },

  // ✅ FIXED: Sign in link better positioned
  signInContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  signInText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  signInLink: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semiBold,
  },

  nameRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: 0,
  },
  nameInputContainer: {
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  backArrow: {
    fontSize: 28,
    color: colors.text,
  },

  // Terms & Conditions styles
  termsContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  termsText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semiBold,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: '#EF4444',
    marginTop: spacing.xs,
    marginLeft: 30,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  modalSectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  modalText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  modalLastUpdated: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  modalFooter: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalAcceptButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalAcceptButtonText: {
    color: '#fff',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
  },
});

export default SignUpScreen;
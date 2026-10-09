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
} from 'react-native';
import { Button, Input, SocialButton } from '../components';
import { colors, typography, spacing } from '../constants';
import { signInWithEmail } from '../services/authservice';

interface SignInScreenProps {
  onSignInSuccess: () => void;
    onNeedsVerification?: (email: string) => void;
  onNavigateToSignUp: () => void;
  onForgotPassword: () => void;
   onNavigateBack: () => void;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  onSignInSuccess,
    onNeedsVerification,
  onNavigateToSignUp,
  onForgotPassword,
  onNavigateBack,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });

  // Validate email
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

// Handle Sign In
  const handleSignIn = async () => {
    // Clear previous errors
    setErrors({
      email: '',
      password: '',
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

    // Validate password
    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }

    if (!isValid) {
      setErrors(newErrors);
      return;
    }

    // Sign in with Firebase
    setLoading(true);
    const result = await signInWithEmail(email, password);
    setLoading(false);

    if (result.success) {
      onSignInSuccess();
    } else if ((result as { needsVerification?: boolean }).needsVerification && onNeedsVerification) {
      onNeedsVerification(email.trim().toLowerCase());
    } else {
      newErrors.email = result.error || 'Sign in failed. Please check your credentials.';
      setErrors(newErrors);
    }
  };

  // Handle Social Sign In
  const handleSocialSignIn = (provider: 'apple' | 'google' | 'facebook') => {
    console.log(`Sign in with ${provider}`);
    // TODO: Integrate social auth here
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
  contentContainerStyle={styles.scrollContent}
  showsVerticalScrollIndicator={false}
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
          <Text style={styles.title}>Sign In</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email Input */}
          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          {/* Password Input */}
          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            isPassword
            error={errors.password}
          />

          {/* Forgot Password Link */}
          <TouchableOpacity
            onPress={onForgotPassword}
            style={styles.forgotPasswordContainer}
          >
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <Button
            title="Sign In"
            onPress={handleSignIn}
            loading={loading}
            style={styles.signInButton}
          />

          {/* Social Sign In */}
          <View style={styles.socialContainer}>
            <SocialButton
              provider="apple"
              onPress={() => handleSocialSignIn('apple')}
            />
            <SocialButton
              provider="google"
              onPress={() => handleSocialSignIn('google')}
            />

          </View>

          {/* Sign Up Link */}
          <TouchableOpacity
            onPress={onNavigateToSignUp}
            style={styles.signUpContainer}
          >
            <Text style={styles.signUpText}>
              Don't have an account?{' '}
              <Text style={styles.signUpLink}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
     paddingTop: 30,
    paddingBottom: spacing.lg,
  },
  
 header: {
    alignItems: 'center',
    marginBottom: spacing.md,
     marginTop: -60,
  },
  
  logo: {
    width: 50,
    height: 90,
    marginTop: spacing ['3xl'],
  },
  
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  
  form: {
    flex: 1,
  },
  
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  
  forgotPasswordText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  
  signInButton: {
    marginTop: spacing.md,
  },
  
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  
  signUpContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  
  signUpText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  
  signUpLink: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semiBold,
  },
  backButton: {
  width: 40,
  height: 40,
  justifyContent: 'center',
  alignItems: 'flex-start',
  marginBottom: spacing.md,
  marginTop: spacing.xl,
},

backArrow: {
  fontSize: 28,
  color: colors.text,
},
});
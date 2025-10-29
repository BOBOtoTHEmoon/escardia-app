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
import { signUpWithEmail } from '../services/authservice';


interface SignUpScreenProps {
  onSignUpSuccess: () => void;
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

  // Validation errors
  const [errors, setErrors] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
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

    if (!isValid) {
      setErrors(newErrors);
      return;
    }

    // Sign up with Firebase
    setLoading(true);
    const result = await signUpWithEmail(email, password, firstName, lastName);
    setLoading(false);

    if (result.success) {
      console.log('Sign up successful!', result.user);
      onSignUpSuccess();
    } else {
      newErrors.email = result.error || 'Sign up failed. Please try again.';
      setErrors(newErrors);
    }
  };

  // Handle Social Sign Up
  const handleSocialSignUp = (provider: 'apple' | 'google' | 'facebook') => {
    console.log(`Sign up with ${provider}`);
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

          {/* Sign Up Button */}
          <Button
            title="Sign Up"
            onPress={handleSignUp}
            loading={loading}
            style={styles.signUpButton}
          />

          {/* Social Sign Up */}
          <View style={styles.socialContainer}>
            <SocialButton
              provider="apple"
              onPress={() => handleSocialSignUp('apple')}
            />
            <SocialButton
              provider="google"
              onPress={() => handleSocialSignUp('google')}
            />
           
          </View>

          {/* Sign In Link */}
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
    paddingBottom: spacing.xs,
  },
  
 header: {
    alignItems: 'center',
    marginBottom: spacing.md,
     marginTop: -70,
  },
  
  logo: {
    width: 50,
    height: 85,
    marginTop: spacing ['2xl'],
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
  
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  
  signInContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
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
});
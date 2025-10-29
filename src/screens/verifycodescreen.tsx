import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'react-native';
import { Button } from '../components';
import { colors, typography, spacing, borderRadius } from '../constants';

interface VerifyCodeScreenProps {
  onVerifySuccess: () => void;
  email?: string;
}

export const VerifyCodeScreen: React.FC<VerifyCodeScreenProps> = ({
  onVerifySuccess,
  email,
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Refs for input fields
  const inputRefs = useRef<(TextInput | null)[]>([]);
  // Countdown timer
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  // Handle code input
  const handleCodeChange = (text: string, index: number) => {
    // Only allow numbers
    if (text && !/^\d+$/.test(text)) return;

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle verify
  const handleVerify = () => {
    const fullCode = code.join('');

     if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    // TODO: Integrate Firebase verification here
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      console.log('Verification successful!', fullCode);
      onVerifySuccess();
    }, 2000);
  };

  // Handle resend code
  const handleResend = () => {
    if (!canResend) return;

    console.log('Resending code...');
    // TODO: Integrate resend logic here
    setTimer(60);
    setCanResend(false);
    setCode(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>Verify Code</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          {email
            ? `We've sent a code to ${email}`
            : "Enter the code we've sent to your email"}
        </Text>

       {/* OTP Input Fields */}
        <View style={styles.otpContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              style={[
                styles.otpInput,
                digit && styles.otpInputFilled,
                error && styles.otpInputError,
              ]}
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Error Message */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Verify Button */}
        <Button
          title="Verify"
          onPress={handleVerify}
          loading={loading}
          style={styles.verifyButton}
        />

        {/* Resend Code */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive any code? </Text>
          <TouchableOpacity onPress={handleResend} disabled={!canResend}>
            <Text
              style={[
                styles.resendLink,
                !canResend && styles.resendLinkDisabled,
              ]}
            >
              {canResend ? 'Resend' : `Resend in ${timer}s`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
    alignItems: 'center',
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },

  logo: {
    width: 80,
    height: 40,
  },

  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },

  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },

  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },

  otpInput: {
    width: 50,
    height: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.inputBackground,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
  },

  otpInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },

  otpInputError: {
    borderColor: colors.error,
  },

  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    marginBottom: spacing.md,
  },

  verifyButton: {
    width: '100%',
    marginTop: spacing.lg,
  },

  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
  },

  resendText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },

  resendLink: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: typography.fontWeight.semiBold,
  },

  resendLinkDisabled: {
    color: colors.textLight,
  },
});
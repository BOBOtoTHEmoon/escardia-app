import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../constants';

interface VendorPhoneVerificationScreenProps {
  onContinue: () => void;
  onNavigateBack: () => void;
  phoneNumber: string;
}

export const VendorPhoneVerificationScreen: React.FC<VendorPhoneVerificationScreenProps> = ({
  onContinue,
  onNavigateBack,
  phoneNumber,
}) => {
  const [code, setCode] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const setInputRef = (element: TextInput | null, index: number) => {
    inputRefs.current[index] = element;
  };

  const handleCodeChange = (text: string, index: number) => {
    if (text && !/^\d+$/.test(text)) return;

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    setError('');

    if (text && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleContinue = () => {
    const fullCode = code.join('');
    
    if (fullCode.length !== 4) {
      setError('Please enter the complete 4-digit code');
      return;
    }

    console.log('Verifying code:', fullCode);
    onContinue();
  };

  const handleResend = () => {
    console.log('Resending code to:', phoneNumber);
    alert('Verification code sent!');
    setCode(['', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  return (
    <View style={styles.container}>
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
          <View style={styles.progressLine} />
          <View style={styles.progressStep} />
          <View style={styles.progressLine} />
          <View style={styles.progressStep} />
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>Phone number Verification</Text>

      {/* Code Input */}
      <View style={styles.codeContainer}>
        {[0, 1, 2, 3].map((index) => (
          <TextInput
            key={index}
            ref={(element) => setInputRef(element, index)}
            style={[styles.codeInput, error && styles.codeInputError]}
            maxLength={1}
            keyboardType="number-pad"
            value={code[index]}
            onChangeText={(text) => handleCodeChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            selectTextOnFocus
          />
        ))}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Resend Link */}
      <View style={styles.resendContainer}>
        <Text style={styles.resendText}>Didn't receive any code? </Text>
        <TouchableOpacity onPress={handleResend}>
          <Text style={styles.resendLink}>Resend</Text>
        </TouchableOpacity>
      </View>

      {/* Continue Button */}
      <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
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
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  codeInput: {
    width: 60,
    height: 60,
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    color: colors.text,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  codeInputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  resendText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  resendLink: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.semiBold,
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
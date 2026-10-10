import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { verifyEmailCode, resendVerificationCode } from '../services/authservice';
import { AppText, Banner, Button, IconButton, LinkText, OtpInput, Screen } from '../ui';
import { brand, color, gutter, themed, statusBarStyle } from '../theme';

interface VerifyCodeScreenProps {
  onVerifySuccess: () => void;
  onNavigateBack?: () => void;
  email?: string;
}

export const VerifyCodeScreen: React.FC<VerifyCodeScreenProps> = ({ onVerifySuccess, onNavigateBack, email }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const verify = async (value = code) => {
    if (value.length !== 6) {
      setError('Enter all 6 digits');
      return;
    }
    if (!email) {
      setError('We lost your email address. Go back and sign up again.');
      return;
    }
    setLoading(true);
    setError('');
    const result = await verifyEmailCode(email, value);
    setLoading(false);
    if (result.success) onVerifySuccess();
    else setError(result.error || 'That code is wrong or has expired');
  };

  const resend = async () => {
    if (timer > 0 || !email) return;
    const result = await resendVerificationCode(email);
    if (!result.success) {
      setError(result.error || 'We could not send a new code');
      return;
    }
    setError('');
    setNotice('A new code is on its way.');
    setCode('');
    setTimer(60);
  };

  return (
    <Screen>
      <StatusBar style={statusBarStyle()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.top}>{onNavigateBack && <IconButton icon="chevron-left" onPress={onNavigateBack} accessibilityLabel="Go back" />}</View>

        <View style={styles.content}>
          <View style={styles.iconRing}>
            <View style={styles.iconCircle}>
              <Feather name="mail" size={26} color={color.primary} />
            </View>
          </View>

          <AppText variant="title" center>
            Check your email
          </AppText>
          <AppText variant="body" color={color.muted} center style={{ marginTop: 8, marginBottom: 32 }}>
            We sent a 6-digit code to{'\n'}
            <AppText variant="bodyMedium" color={color.ink}>
              {email || 'your email'}
            </AppText>
          </AppText>

          <OtpInput
            value={code}
            autoFocus
            error={!!error}
            onChange={(v) => {
              setCode(v);
              setError('');
              setNotice('');
              if (v.length === 6) verify(v);
            }}
          />

          <View style={{ marginTop: 20 }}>
            {!!error && <Banner text={error} />}
            {!!notice && !error && <Banner tone="success" text={notice} />}
          </View>

          <Button title="Verify email" onPress={() => verify()} loading={loading} disabled={code.length !== 6} style={{ marginTop: 8 }} />

          <View style={styles.resend}>
            <AppText variant="body" color={color.muted}>
              Didn&apos;t get it?{' '}
            </AppText>
            {timer > 0 ? (
              <AppText variant="bodyMedium" color={color.subtle}>
                Resend in 0:{String(timer).padStart(2, '0')}
              </AppText>
            ) : (
              <LinkText onPress={resend}>Send a new code</LinkText>
            )}
          </View>
          <AppText variant="small" color={color.subtle} center style={{ marginTop: 12 }}>
            Check your spam folder if it is not in your inbox.
          </AppText>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = themed(() => StyleSheet.create({
  top: { height: 56, paddingHorizontal: gutter, justifyContent: 'center' },
  content: { flex: 1, paddingHorizontal: gutter, paddingTop: 24 },
  iconRing: {
    alignSelf: 'center',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: color.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: color.primaryBorder,
  },
  resend: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
}));

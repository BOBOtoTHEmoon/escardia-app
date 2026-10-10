import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { sendPasswordResetCode, resetPasswordWithCode } from '../services/authservice';
import { AppText, Banner, Button, LinkText, OtpInput, TextField } from '../ui';
import { AuthLayout } from '../ui/AuthLayout';
import { color } from '../theme';

interface ForgotPasswordScreenProps {
  initialEmail?: string;
  onNavigateBack: () => void;
  /** Called after the new password is set (the user is signed in at that point). */
  onDone: () => void;
}

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const strong = (p: string) => p.length >= 8 && /\d/.test(p) && /[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\/;']/.test(p);

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ initialEmail = '', onNavigateBack, onDone }) => {
  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const sendCode = async () => {
    if (!isEmail(email)) {
      setError('Enter the email you signed up with');
      return;
    }
    setLoading(true);
    setError('');
    const result = await sendPasswordResetCode(email);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'We could not send the code. Please try again.');
      return;
    }
    setStep('reset');
    setTimer(60);
  };

  const reset = async () => {
    if (code.length !== 6) return setError('Enter the 6-digit code from your email');
    if (!strong(password)) return setError('Use 8 or more characters with a number and a special character');
    if (password !== confirm) return setError('Passwords do not match');
    setLoading(true);
    setError('');
    const result = await resetPasswordWithCode(email, code, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'That code is wrong or has expired');
      return;
    }
    setStep('done');
  };

  if (step === 'done') {
    return (
      <AuthLayout title="Password updated" subtitle="You are signed in with your new password.">
        <View style={{ alignItems: 'center', paddingVertical: 24 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: color.successSoft,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Feather name="check" size={32} color={color.success} />
          </View>
          <AppText variant="body" color={color.muted} center>
            Use it the next time you sign in on any device.
          </AppText>
        </View>
        <Button title="Continue" iconRight="arrow-right" onPress={onDone} />
      </AuthLayout>
    );
  }

  if (step === 'reset') {
    return (
      <AuthLayout title="Set a new password" subtitle={`Enter the code we sent to ${email.trim().toLowerCase()}.`} onBack={() => setStep('email')}>
        {!!error && <Banner text={error} />}
        <AppText variant="smallMedium" color={color.text} style={{ marginBottom: 8 }}>
          6-digit code
        </AppText>
        <OtpInput
          value={code}
          autoFocus
          onChange={(v) => {
            setCode(v);
            setError('');
          }}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, marginBottom: 20 }}>
          {timer > 0 ? (
            <AppText variant="small" color={color.subtle}>
              Resend in 0:{String(timer).padStart(2, '0')}
            </AppText>
          ) : (
            <LinkText onPress={sendCode} style={{ fontSize: 13 }}>
              Send a new code
            </LinkText>
          )}
        </View>

        <TextField
          label="New password"
          icon="lock"
          placeholder="8+ characters, a number and a symbol"
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            setError('');
          }}
          isPassword
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <TextField
          label="Confirm new password"
          icon="lock"
          placeholder="Type it again"
          value={confirm}
          onChangeText={(v) => {
            setConfirm(v);
            setError('');
          }}
          isPassword
          autoComplete="new-password"
          textContentType="newPassword"
          containerStyle={{ marginBottom: 24 }}
        />
        <Button title="Update password" onPress={reset} loading={loading} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot your password?" subtitle="Enter your email and we will send you a code to reset it." onBack={onNavigateBack}>
      {!!error && <Banner text={error} />}
      <TextField
        label="Email"
        icon="mail"
        placeholder="you@example.com"
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          setError('');
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="send"
        onSubmitEditing={sendCode}
        containerStyle={{ marginBottom: 24 }}
      />
      <Button title="Send reset code" onPress={sendCode} loading={loading} />
    </AuthLayout>
  );
};

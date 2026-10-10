// Vendor sign in. Customer accounts are turned away by signInVendor.
import React, { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { signInVendor } from '../services/vendorauthservice';
import { AppText, Banner, Button, LinkText, TextField } from '../ui';
import { AuthLayout } from '../ui/AuthLayout';
import { color } from '../theme';

interface VendorSignInScreenProps {
  onSignInSuccess: () => void;
  onNeedsVerification?: (email: string) => void;
  onNavigateToSignUp: () => void;
  onForgotPassword: () => void;
  onNavigateBack: () => void;
}

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export const VendorSignInScreen: React.FC<VendorSignInScreenProps> = ({ onSignInSuccess, onNeedsVerification, onNavigateToSignUp, onForgotPassword, onNavigateBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState('');
  const passwordRef = useRef<TextInput>(null);

  const submit = async () => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = 'Enter your email';
    else if (!isEmail(email)) next.email = 'That email does not look right';
    if (!password) next.password = 'Enter your password';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;

    setLoading(true);
    const r = await signInVendor(email, password);
    setLoading(false);
    if (r.success) return onSignInSuccess();
    if (r.needsVerification && onNeedsVerification) return onNeedsVerification(email.trim().toLowerCase());
    setFormError(r.error || 'Email or password is incorrect.');
  };

  return (
    <AuthLayout
      title="Vendor sign in"
      subtitle="Manage your fleet, bookings and earnings."
      onBack={onNavigateBack}
      footer={
        <AppText variant="body" color={color.muted}>
          Not a vendor yet? <LinkText onPress={onNavigateToSignUp}>Apply now</LinkText>
        </AppText>
      }
    >
      {!!formError && <Banner text={formError} />}

      <TextField
        label="Email"
        icon="mail"
        placeholder="you@business.com"
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          if (errors.email) setErrors({ ...errors, email: undefined });
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        error={errors.email}
      />
      <TextField
        ref={passwordRef}
        label="Password"
        icon="lock"
        placeholder="Your password"
        value={password}
        onChangeText={(v) => {
          setPassword(v);
          if (errors.password) setErrors({ ...errors, password: undefined });
        }}
        isPassword
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
        error={errors.password}
        containerStyle={{ marginBottom: 10 }}
      />
      <View style={{ alignItems: 'flex-end', marginBottom: 24 }}>
        <LinkText onPress={onForgotPassword}>Forgot password?</LinkText>
      </View>

      <Button title="Sign in" iconRight="arrow-right" onPress={submit} loading={loading} />
    </AuthLayout>
  );
};

import React, { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { signInWithEmail } from '../services/authservice';
import { AppText, Banner, Button, LinkText, TextField } from '../ui';
import { AuthLayout } from '../ui/AuthLayout';
import { color } from '../theme';

interface SignInScreenProps {
  onSignInSuccess: () => void;
  onNeedsVerification?: (email: string) => void;
  onNavigateToSignUp: () => void;
  onForgotPassword: () => void;
  onNavigateBack: () => void;
}

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

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
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState('');
  const passwordRef = useRef<TextInput>(null);

  const handleSignIn = async () => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = 'Enter your email';
    else if (!isEmail(email)) next.email = 'That email does not look right';
    if (!password) next.password = 'Enter your password';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;

    setLoading(true);
    const result = await signInWithEmail(email, password);
    setLoading(false);

    if (result.success) {
      onSignInSuccess();
    } else if ((result as { needsVerification?: boolean }).needsVerification && onNeedsVerification) {
      onNeedsVerification(email.trim().toLowerCase());
    } else {
      setFormError(result.error || 'Email or password is incorrect.');
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to book your next ride."
      onBack={onNavigateBack}
      footer={
        <AppText variant="body" color={color.muted}>
          New to Escardia? <LinkText onPress={onNavigateToSignUp}>Create an account</LinkText>
        </AppText>
      }
    >
      {!!formError && <Banner text={formError} />}

      <TextField
        label="Email"
        icon="mail"
        placeholder="you@example.com"
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
        autoComplete="password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleSignIn}
        error={errors.password}
        containerStyle={{ marginBottom: 10 }}
      />

      <View style={{ alignItems: 'flex-end', marginBottom: 28 }}>
        <LinkText onPress={onForgotPassword}>Forgot password?</LinkText>
      </View>

      <Button title="Sign in" iconRight="arrow-right" onPress={handleSignIn} loading={loading} />
    </AuthLayout>
  );
};

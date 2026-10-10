import React, { useRef, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signUpWithEmail } from '../services/authservice';
import { AppText, Banner, Button, Checkbox, IconButton, LinkText, TextField } from '../ui';
import { AuthLayout } from '../ui/AuthLayout';
import { color, gutter, themed } from '../theme';

interface SignUpScreenProps {
  onSignUpSuccess: (email: string, needsVerification: boolean) => void;
  onNavigateToSignIn: () => void;
  onNavigateBack: () => void;
}

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const RULES = [
  { label: '8 or more characters', test: (p: string) => p.length >= 8 },
  { label: 'A number', test: (p: string) => /\d/.test(p) },
  { label: 'A special character, like ! or @', test: (p: string) => /[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\/;']/.test(p) },
];

type Errors = Partial<Record<'firstName' | 'lastName' | 'email' | 'password' | 'confirmPassword' | 'terms', string>>;

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ onSignUpSuccess, onNavigateToSignIn, onNavigateBack }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');

  const lastRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const clear = (key: keyof Errors) => errors[key] && setErrors({ ...errors, [key]: undefined });

  const handleSignUp = async () => {
    const next: Errors = {};
    if (!firstName.trim()) next.firstName = 'Required';
    if (!lastName.trim()) next.lastName = 'Required';
    if (!email.trim()) next.email = 'Enter your email';
    else if (!isEmail(email)) next.email = 'That email does not look right';
    if (!password) next.password = 'Choose a password';
    else if (!RULES.every((r) => r.test(password))) next.password = 'Your password needs everything in the list below';
    if (!confirmPassword) next.confirmPassword = 'Type your password again';
    else if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match';
    if (!agreed) next.terms = 'Please accept the terms to continue';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;

    setLoading(true);
    const result = await signUpWithEmail(email, password, firstName.trim(), lastName.trim());
    setLoading(false);

    if (result.success) {
      onSignUpSuccess(email.trim().toLowerCase(), result.needsVerification !== false);
    } else {
      setFormError(result.error || 'We could not create your account. Please try again.');
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Book premium cars and security across Lagos in minutes."
      onBack={onNavigateBack}
      footer={
        <AppText variant="body" color={color.muted}>
          Already have an account? <LinkText onPress={onNavigateToSignIn}>Sign in</LinkText>
        </AppText>
      }
    >
      {!!formError && <Banner text={formError} />}

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TextField
          label="First name"
          placeholder="Nifemi"
          value={firstName}
          onChangeText={(v) => {
            setFirstName(v);
            clear('firstName');
          }}
          autoCapitalize="words"
          autoComplete="given-name"
          textContentType="givenName"
          returnKeyType="next"
          onSubmitEditing={() => lastRef.current?.focus()}
          error={errors.firstName}
          containerStyle={{ flex: 1 }}
        />
        <TextField
          ref={lastRef}
          label="Last name"
          placeholder="Idowu"
          value={lastName}
          onChangeText={(v) => {
            setLastName(v);
            clear('lastName');
          }}
          autoCapitalize="words"
          autoComplete="family-name"
          textContentType="familyName"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          error={errors.lastName}
          containerStyle={{ flex: 1 }}
        />
      </View>

      <TextField
        ref={emailRef}
        label="Email"
        icon="mail"
        placeholder="you@example.com"
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          clear('email');
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
        placeholder="Create a password"
        value={password}
        onChangeText={(v) => {
          setPassword(v);
          clear('password');
        }}
        isPassword
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
        error={errors.password}
        containerStyle={{ marginBottom: 10 }}
      />

      <View style={styles.rules}>
        {RULES.map((r) => {
          const ok = r.test(password);
          return (
            <View key={r.label} style={styles.rule}>
              <View style={[styles.ruleDot, ok && styles.ruleDotOk]}>{ok && <Feather name="check" size={10} color="#FFFFFF" />}</View>
              <AppText variant="small" color={ok ? color.ink : color.muted}>
                {r.label}
              </AppText>
            </View>
          );
        })}
      </View>

      <TextField
        ref={confirmRef}
        label="Confirm password"
        icon="lock"
        placeholder="Type it again"
        value={confirmPassword}
        onChangeText={(v) => {
          setConfirmPassword(v);
          clear('confirmPassword');
        }}
        isPassword
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        error={errors.confirmPassword}
      />

      <View style={{ marginBottom: 24 }}>
        <Checkbox
          checked={agreed}
          onPress={() => {
            setAgreed(!agreed);
            clear('terms');
          }}
        >
          <AppText variant="small" color={color.text} style={{ lineHeight: 20 }}>
            I agree to Escardia&apos;s{' '}
            <LinkText style={{ fontSize: 13 }} onPress={() => setShowTerms(true)}>
              Terms and Conditions
            </LinkText>{' '}
            and{' '}
            <LinkText style={{ fontSize: 13 }} onPress={() => Linking.openURL('https://www.escardia.com/privacy').catch(() => {})}>
              Privacy Policy
            </LinkText>
          </AppText>
        </Checkbox>
        {!!errors.terms && (
          <AppText variant="small" color={color.danger} style={{ marginTop: 8, marginLeft: 34 }}>
            {errors.terms}
          </AppText>
        )}
      </View>

      <Button title="Create account" iconRight="arrow-right" onPress={handleSignUp} loading={loading} />

      <TermsSheet
        visible={showTerms}
        onClose={() => setShowTerms(false)}
        onAccept={() => {
          setAgreed(true);
          clear('terms');
          setShowTerms(false);
        }}
      />
    </AuthLayout>
  );
};

const TERMS: { title: string; body: string }[] = [
  {
    title: '1. Acceptance of terms',
    body: 'By using the Escardia app, you agree to these Terms and Conditions. If you do not agree, please do not use our services.',
  },
  {
    title: '2. Eligibility',
    body: "You must be at least 18 years old and hold a valid driver's licence to rent a vehicle through Escardia.",
  },
  {
    title: '3. Your account',
    body: 'Give accurate information when you sign up. You are responsible for keeping your login details safe and for everything done with your account.',
  },
  {
    title: '4. Bookings and payments',
    body:
      '• All bookings depend on the car being available\n• The price you see at checkout includes Escardia’s service fee\n• You pay in full before the trip starts\n• Refunds depend on how early you cancel, as shown before you book',
  },
  {
    title: '5. Using the vehicle',
    body:
      '• Follow Nigerian traffic laws\n• No smoking, pets or illegal activity in any vehicle\n• You are responsible for damage during your trip\n• Return the car in the condition you received it\n• Late returns may cost extra',
  },
  {
    title: '6. Contact us',
    body: 'Questions about these terms? Email support@escardia.com.',
  },
];

const TermsSheet = ({ visible, onClose, onAccept }: { visible: boolean; onClose: () => void; onAccept: () => void }) => {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: color.bg }}>
        <View style={styles.sheetHeader}>
          <AppText variant="heading">Terms and Conditions</AppText>
          <IconButton icon="x" size={38} onPress={onClose} accessibilityLabel="Close" />
        </View>
        <ScrollView contentContainerStyle={{ padding: gutter, paddingBottom: 32 }}>
          {TERMS.map((t) => (
            <View key={t.title} style={{ marginBottom: 20 }}>
              <AppText variant="subheading" style={{ marginBottom: 6 }}>
                {t.title}
              </AppText>
              <AppText variant="body" color={color.text}>
                {t.body}
              </AppText>
            </View>
          ))}
          <AppText variant="small" color={color.subtle}>
            Last updated October 2026
          </AppText>
        </ScrollView>
        <View style={[styles.sheetFooter, { paddingBottom: insets.bottom + 16 }]}>
          <Button title="I accept" onPress={onAccept} />
        </View>
      </View>
    </Modal>
  );
};

const styles = themed(() => StyleSheet.create({
  rules: { gap: 6, marginBottom: 20, paddingLeft: 2 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: color.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleDotOk: { backgroundColor: color.success, borderColor: color.success },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: gutter,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
    backgroundColor: color.surface,
  },
  sheetFooter: { paddingHorizontal: gutter, paddingTop: 12, borderTopWidth: 1, borderTopColor: color.border, backgroundColor: color.surface },
}));


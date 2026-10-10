// Vendor sign up, step 1 of 3: personal details and login.
import React, { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { startVendorSignUp } from '../services/vendorauthservice';
import { useAppSettings } from '../hooks/useAppSettings';
import { vendorAgreement, vendorPrivacy, AGREEMENT_UPDATED } from '../content/vendorAgreement';
import { AppText, Banner, Button, Checkbox, LinkText, TextField } from '../ui';
import { AuthLayout } from '../ui/AuthLayout';
import { DocSheet, Steps } from '../ui/Kit';
import { color, themed } from '../theme';

export interface VendorAccountData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

interface VendorAccountCreationScreenProps {
  /** Called once the login exists. needsVerification is true when an email code was sent. */
  onAccountCreated: (data: VendorAccountData, needsVerification: boolean) => void;
  onNavigateBack: () => void;
  onNavigateToVendorSignIn: () => void;
}

export const VENDOR_STEPS = ['Account', 'Business', 'Identity'];

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const RULES = [
  { label: '8 or more characters', test: (p: string) => p.length >= 8 },
  { label: 'A number', test: (p: string) => /\d/.test(p) },
  { label: 'A special character, like ! or @', test: (p: string) => /[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\/;']/.test(p) },
];

type Field = 'firstName' | 'lastName' | 'email' | 'phone' | 'password' | 'confirm' | 'terms';

export const VendorAccountCreationScreen: React.FC<VendorAccountCreationScreenProps> = ({ onAccountCreated, onNavigateBack, onNavigateToVendorSignIn }) => {
  const { settings } = useAppSettings();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [doc, setDoc] = useState<'terms' | 'privacy' | null>(null);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const lastRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const clear = (k: Field) => errors[k] && setErrors({ ...errors, [k]: undefined });

  const submit = async () => {
    const next: Partial<Record<Field, string>> = {};
    const digits = phone.replace(/\D/g, '');
    if (!firstName.trim()) next.firstName = 'Required';
    if (!lastName.trim()) next.lastName = 'Required';
    if (!email.trim()) next.email = 'Enter your email';
    else if (!isEmail(email)) next.email = 'That email does not look right';
    if (!digits) next.phone = 'Enter your phone number';
    else if (digits.length < 10 || digits.length > 14) next.phone = 'Enter a valid number, like 0803 123 4567';
    if (!password) next.password = 'Choose a password';
    else if (!RULES.every((r) => r.test(password))) next.password = 'Your password needs everything in the list below';
    if (!confirm) next.confirm = 'Type your password again';
    else if (password !== confirm) next.confirm = 'Passwords do not match';
    if (!agreed) next.terms = 'Please accept the vendor agreement to continue';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;

    const data: VendorAccountData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phoneNumber: phone.trim(),
      password,
    };
    setLoading(true);
    const r = await startVendorSignUp(data);
    setLoading(false);
    if (!r.success) return setFormError(r.error || 'We could not create your account. Please try again.');
    onAccountCreated(data, r.needsVerification !== false);
  };

  return (
    <AuthLayout
      title="Create your vendor account"
      subtitle="Start with your own details. Your business comes next."
      onBack={onNavigateBack}
      footer={
        <AppText variant="body" color={color.muted}>
          Already a vendor? <LinkText onPress={onNavigateToVendorSignIn}>Sign in</LinkText>
        </AppText>
      }
    >
      <Steps steps={VENDOR_STEPS} current={1} />
      {!!formError && <Banner text={formError} />}

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TextField
          label="First name"
          placeholder="Tunde"
          value={firstName}
          onChangeText={(v) => (setFirstName(v), clear('firstName'))}
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
          placeholder="Bakare"
          value={lastName}
          onChangeText={(v) => (setLastName(v), clear('lastName'))}
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
        placeholder="you@business.com"
        value={email}
        onChangeText={(v) => (setEmail(v), clear('email'))}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => phoneRef.current?.focus()}
        error={errors.email}
      />

      <TextField
        ref={phoneRef}
        label="Phone number"
        icon="phone"
        placeholder="0803 123 4567"
        value={phone}
        onChangeText={(v) => (setPhone(v), clear('phone'))}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        error={errors.phone}
        hint="Customers on your trips will see this number."
      />

      <TextField
        ref={passwordRef}
        label="Password"
        icon="lock"
        placeholder="Create a password"
        value={password}
        onChangeText={(v) => (setPassword(v), clear('password'))}
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
        value={confirm}
        onChangeText={(v) => (setConfirm(v), clear('confirm'))}
        isPassword
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={submit}
        error={errors.confirm}
      />

      <View style={{ marginBottom: 24 }}>
        <Checkbox checked={agreed} onPress={() => (setAgreed(!agreed), clear('terms'))}>
          <AppText variant="small" color={color.text} style={{ lineHeight: 20 }}>
            I agree to the{' '}
            <LinkText style={{ fontSize: 13 }} onPress={() => setDoc('terms')}>
              Vendor Agreement
            </LinkText>{' '}
            and{' '}
            <LinkText style={{ fontSize: 13 }} onPress={() => setDoc('privacy')}>
              Vendor Privacy Notice
            </LinkText>
          </AppText>
        </Checkbox>
        {!!errors.terms && (
          <AppText variant="small" color={color.danger} style={{ marginTop: 8, marginLeft: 34 }}>
            {errors.terms}
          </AppText>
        )}
      </View>

      <Button title="Continue" iconRight="arrow-right" onPress={submit} loading={loading} />

      <DocSheet
        visible={doc === 'terms'}
        title="Vendor Agreement"
        sections={vendorAgreement(settings)}
        updated={AGREEMENT_UPDATED}
        onClose={() => setDoc(null)}
        onAccept={() => {
          setAgreed(true);
          clear('terms');
          setDoc(null);
        }}
      />
      <DocSheet visible={doc === 'privacy'} title="Vendor Privacy Notice" sections={vendorPrivacy} updated={AGREEMENT_UPDATED} onClose={() => setDoc(null)} />
    </AuthLayout>
  );
};

const styles = themed(() => StyleSheet.create({
  rules: { gap: 6, marginBottom: 20, paddingLeft: 2 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: color.borderStrong, alignItems: 'center', justifyContent: 'center' },
  ruleDotOk: { backgroundColor: color.success, borderColor: color.success },
}));

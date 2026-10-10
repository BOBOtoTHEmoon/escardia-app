// Business details: contact person, business name and the number customers see. Plus password.
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { auth } from '../config/supabase';
import { getVendorProfile } from '../services/vendorauthservice';
import { updateVendorAccount } from '../services/vendorService';
import { AppText, Banner, Button, Screen, ScreenHeader, TextField } from '../ui';
import { BottomBar } from '../ui/Booking';
import { MenuGroup, MenuRow } from '../ui/Menu';
import { color, gutter, statusBarStyle } from '../theme';

interface VendorSettingsScreenProps {
  onNavigateBack: () => void;
  onChangePassword: () => void;
  onSaved?: () => void;
}

const validPhone = (p: string) => {
  const d = p.replace(/\D/g, '');
  return d.length >= 10 && d.length <= 14;
};

export const VendorSettingsScreen: React.FC<VendorSettingsScreenProps> = ({ onNavigateBack, onChangePassword, onSaved }) => {
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    getVendorProfile(auth.currentUser?.uid ?? '').then((r) => {
      if (r.success && r.data) {
        setFirstName(r.data.firstName);
        setLastName(r.data.lastName);
        setPhone(r.data.phoneNumber);
        setBusinessName(r.data.businessName);
        setBusinessPhone(r.data.businessPhone || r.data.phoneNumber);
        setEmail(r.data.email);
      }
      setLoading(false);
    });
  }, []);

  const save = async () => {
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.firstName = 'Required';
    if (!lastName.trim()) next.lastName = 'Required';
    if (!validPhone(phone)) next.phone = 'Enter a valid number';
    if (businessName.trim().length < 2) next.businessName = 'Enter your business name';
    if (!validPhone(businessPhone)) next.businessPhone = 'Enter a valid number';
    setErrors(next);
    setNotice(null);
    if (Object.keys(next).length) return;
    setSaving(true);
    const r = await updateVendorAccount({ firstName, lastName, phone, businessName, businessPhone });
    setSaving(false);
    if (!r.success) return setNotice({ tone: 'danger', text: r.error || 'Could not save. Please try again.' });
    setNotice({ tone: 'success', text: 'Your details are saved.' });
    onSaved?.();
  };

  const field = (k: string, set: (v: string) => void) => (v: string) => {
    set(v);
    if (errors[k]) setErrors({ ...errors, [k]: undefined });
  };

  return (
    <Screen>
      <StatusBar style={statusBarStyle()} />
      <ScreenHeader title="Business details" onBack={onNavigateBack} />
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={color.primary} />
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
            {notice && <Banner tone={notice.tone} text={notice.text} />}

            <AppText variant="caption" color={color.muted} style={{ marginBottom: 10, marginTop: 4 }}>
              Business
            </AppText>
            <TextField label="Business name" icon="briefcase" value={businessName} onChangeText={field('businessName', setBusinessName)} autoCapitalize="words" error={errors.businessName} />
            <TextField
              label="Business phone"
              icon="phone"
              value={businessPhone}
              onChangeText={field('businessPhone', setBusinessPhone)}
              keyboardType="phone-pad"
              error={errors.businessPhone}
              hint="Customers see this number on their bookings."
            />

            <AppText variant="caption" color={color.muted} style={{ marginBottom: 10, marginTop: 10 }}>
              Contact person
            </AppText>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TextField label="First name" value={firstName} onChangeText={field('firstName', setFirstName)} autoCapitalize="words" error={errors.firstName} containerStyle={{ flex: 1 }} />
              <TextField label="Last name" value={lastName} onChangeText={field('lastName', setLastName)} autoCapitalize="words" error={errors.lastName} containerStyle={{ flex: 1 }} />
            </View>
            <TextField label="Your phone" icon="smartphone" value={phone} onChangeText={field('phone', setPhone)} keyboardType="phone-pad" error={errors.phone} hint="Escardia uses this to reach you." />
            <TextField label="Email" icon="mail" value={email} editable={false} hint="Contact support to change the email you sign in with." containerStyle={{ opacity: 0.7 }} />

            <MenuGroup title="Security">
              <MenuRow icon="lock" label="Change password" onPress={onChangePassword} last />
            </MenuGroup>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
      {!loading && <BottomBar button={<Button title="Save changes" icon="check" onPress={save} loading={saving} />} />}
    </Screen>
  );
};

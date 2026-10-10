// Vendor sign up, step 2 of 3: business name and (optional) CAC certificate.
import React, { useState } from 'react';
import { View } from 'react-native';
import { AppText, Banner, Button, TextField } from '../ui';
import { AuthLayout } from '../ui/AuthLayout';
import { Steps, UploadBox } from '../ui/Kit';
import { VENDOR_STEPS } from './vendoraccountcreationscreen';
import { color } from '../theme';

export interface BusinessRegistrationData {
  businessName: string;
  cacCertificate: string | null;
}

interface VendorBusinessRegistrationScreenProps {
  onContinue: (data: BusinessRegistrationData) => void;
  onNavigateBack: () => void;
  initial?: Partial<BusinessRegistrationData>;
}

export const VendorBusinessRegistrationScreen: React.FC<VendorBusinessRegistrationScreenProps> = ({ onContinue, onNavigateBack, initial }) => {
  const [businessName, setBusinessName] = useState(initial?.businessName ?? '');
  const [cac, setCac] = useState<string | null>(initial?.cacCertificate ?? null);
  const [error, setError] = useState('');

  const submit = () => {
    if (businessName.trim().length < 2) return setError('Enter the name customers will see on your cars');
    onContinue({ businessName: businessName.trim(), cacCertificate: cac });
  };

  return (
    <AuthLayout title="Your business" subtitle="This is the name customers see on your cars and bookings." onBack={onNavigateBack}>
      <Steps steps={VENDOR_STEPS} current={2} />

      <TextField
        label="Business name"
        icon="briefcase"
        placeholder="Prestige Autos"
        value={businessName}
        onChangeText={(v) => {
          setBusinessName(v);
          setError('');
        }}
        autoCapitalize="words"
        autoComplete="organization"
        textContentType="organizationName"
        returnKeyType="done"
        error={error}
        hint="Use your trading name if you are not registered yet."
      />

      <UploadBox
        label="CAC certificate"
        optional
        hint="If your business is registered, add a clear photo of the certificate."
        uri={cac}
        onChange={setCac}
      />

      <Banner tone="info" text="Not registered yet? You can continue without it and add the certificate later from your vendor account." />

      <View style={{ marginTop: 8 }}>
        <Button title="Continue" iconRight="arrow-right" onPress={submit} />
        <AppText variant="small" color={color.muted} center style={{ marginTop: 12 }}>
          Next: a photo of your ID so we can confirm who you are.
        </AppText>
      </View>
    </AuthLayout>
  );
};

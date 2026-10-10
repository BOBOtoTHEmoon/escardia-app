// Vendor sign up, step 3 of 3: ID photos. Submitting uploads everything and sends the application.
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { registerVendor, VendorRegistrationData } from '../services/vendorauthservice';
import { AppText, Banner, Button, TextField } from '../ui';
import { AuthLayout } from '../ui/AuthLayout';
import { ChoiceChips, Steps, UploadBox } from '../ui/Kit';
import { VENDOR_STEPS } from './vendoraccountcreationscreen';
import { brand, color, gutter, radius, themed, statusBarStyle } from '../theme';

type IdType = 'national-id' | 'passport' | 'voters-card';

export interface IDVerificationData {
  nin: string;
  idType: IdType;
  idFront: string;
  idBack: string;
  proofOfAddress: string | null;
}

interface VendorIDVerificationScreenProps {
  /** Account and business details collected on the earlier steps. */
  vendorData: Omit<VendorRegistrationData, keyof IDVerificationData>;
  onNavigateBack: () => void;
  /** Called after the application is saved and the vendor taps through. */
  onComplete: (vendorId: string) => void;
}

const ID_TYPES: { key: IdType; label: string }[] = [
  { key: 'national-id', label: 'National ID' },
  { key: 'passport', label: 'Passport' },
  { key: 'voters-card', label: "Voter's card" },
];

export const VendorIDVerificationScreen: React.FC<VendorIDVerificationScreenProps> = ({ vendorData, onNavigateBack, onComplete }) => {
  const [idType, setIdType] = useState<IdType>('national-id');
  const [nin, setNin] = useState('');
  const [front, setFront] = useState<string | null>(null);
  const [back, setBack] = useState<string | null>(null);
  const [proof, setProof] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<'nin' | 'front' | 'back', string>>>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);

  const passport = idType === 'passport';

  const submit = async () => {
    const next: typeof errors = {};
    if (idType === 'national-id' && !/^\d{11}$/.test(nin.trim())) next.nin = 'Your NIN is the 11-digit number on your slip or card';
    if (!front) next.front = passport ? 'Add a photo of your passport photo page' : 'Add a photo of the front';
    if (!passport && !back) next.back = 'Add a photo of the back';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;

    setSaving(true);
    const r = await registerVendor({
      ...vendorData,
      nin: idType === 'national-id' ? nin.trim() : '',
      idType,
      idFront: front!,
      idBack: passport ? '' : back!,
      proofOfAddress: proof,
    });
    setSaving(false);
    if (!r.success) return setFormError(r.error || 'We could not send your application. Please try again.');
    setDoneId(r.vendorId!);
  };

  if (doneId) return <Submitted businessName={vendorData.businessName} onContinue={() => onComplete(doneId)} />;

  return (
    <AuthLayout title="Confirm who you are" subtitle="Escardia checks every vendor before they can take bookings. Your ID is stored privately." onBack={saving ? undefined : onNavigateBack}>
      <Steps steps={VENDOR_STEPS} current={3} />
      {!!formError && <Banner text={formError} />}

      <AppText variant="smallMedium" color={color.text} style={{ marginBottom: 8 }}>
        ID type
      </AppText>
      <ChoiceChips
        options={ID_TYPES}
        value={idType}
        onChange={(k) => {
          setIdType(k);
          setErrors({});
        }}
        style={{ marginBottom: 18 }}
      />

      {idType === 'national-id' && (
        <TextField
          label="NIN"
          icon="hash"
          placeholder="11-digit number"
          value={nin}
          onChangeText={(v) => {
            setNin(v.replace(/\D/g, '').slice(0, 11));
            if (errors.nin) setErrors({ ...errors, nin: undefined });
          }}
          keyboardType="number-pad"
          maxLength={11}
          error={errors.nin}
        />
      )}

      <UploadBox
        label={passport ? 'Passport photo page' : 'Front of your ID'}
        uri={front}
        onChange={(u) => {
          setFront(u);
          if (errors.front) setErrors({ ...errors, front: undefined });
        }}
        error={errors.front}
      />
      {!passport && (
        <UploadBox
          label="Back of your ID"
          uri={back}
          onChange={(u) => {
            setBack(u);
            if (errors.back) setErrors({ ...errors, back: undefined });
          }}
          error={errors.back}
        />
      )}
      <UploadBox label="Proof of address" optional hint="A recent utility bill or bank statement with your address." uri={proof} onChange={setProof} />

      <View style={styles.privacy}>
        <Feather name="lock" size={14} color={color.success} />
        <AppText variant="small" color={color.text} style={{ flex: 1 }}>
          Only Escardia&apos;s review team can see these photos. Customers never see them.
        </AppText>
      </View>

      <Button title={saving ? 'Sending your application' : 'Submit application'} icon="send" onPress={submit} loading={saving} />
      {saving && (
        <AppText variant="small" color={color.muted} center style={{ marginTop: 10 }}>
          Uploading your photos. This can take a moment on a slow connection.
        </AppText>
      )}
    </AuthLayout>
  );
};

const Submitted = ({ businessName, onContinue }: { businessName: string; onContinue: () => void }) => {
  const insets = useSafeAreaInsets();
  const NEXT = [
    { icon: 'search' as const, text: 'Escardia reviews your details and ID.' },
    { icon: 'truck' as const, text: 'Meanwhile, add your cars. Each one is reviewed too.' },
    { icon: 'bell' as const, text: 'We notify you as soon as you are approved, and your cars go live.' },
  ];
  return (
    <View style={[styles.done, { paddingTop: insets.top }]}>
      <StatusBar style={statusBarStyle()} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: gutter, paddingBottom: insets.bottom + 24 }}>
        <View style={styles.ring}>
          <View style={styles.circle}>
            <Feather name="check" size={30} color="#FFFFFF" />
          </View>
        </View>
        <AppText variant="title" center style={{ marginTop: 20 }}>
          Application sent
        </AppText>
        <AppText variant="body" color={color.muted} center style={{ marginTop: 6 }}>
          Welcome to Escardia, {businessName}. Here is what happens next.
        </AppText>
        <View style={styles.nextCard}>
          {NEXT.map((n, i) => (
            <View key={n.text} style={[styles.nextRow, i < NEXT.length - 1 && { borderBottomWidth: 1, borderBottomColor: color.border }]}>
              <View style={styles.nextIcon}>
                <Feather name={n.icon} size={16} color={color.primary} />
              </View>
              <AppText variant="body" style={{ flex: 1 }}>
                {n.text}
              </AppText>
            </View>
          ))}
        </View>
        <Button title="Go to my dashboard" iconRight="arrow-right" onPress={onContinue} style={{ marginTop: 24 }} />
      </ScrollView>
    </View>
  );
};

const styles = themed(() => StyleSheet.create({
  privacy: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 20, paddingHorizontal: 2 },
  done: { flex: 1, backgroundColor: color.bg },
  ring: { alignSelf: 'center', width: 92, height: 92, borderRadius: 46, backgroundColor: color.successSoft, alignItems: 'center', justifyContent: 'center' },
  circle: { width: 66, height: 66, borderRadius: 33, backgroundColor: color.success, alignItems: 'center', justifyContent: 'center' },
  nextCard: { marginTop: 24, paddingHorizontal: 14, borderRadius: radius.xl, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  nextIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: color.primarySoft, alignItems: 'center', justifyContent: 'center' },
}));

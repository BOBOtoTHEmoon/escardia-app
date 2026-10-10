// Vendor agreement and vendor privacy notice, with the live commission and payout rules.
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { vendorAgreement, vendorPrivacy, AGREEMENT_UPDATED } from '../content/vendorAgreement';
import { useAppSettings } from '../hooks/useAppSettings';
import { AppText, Screen, ScreenHeader } from '../ui';
import { Segmented } from '../ui/Kit';
import { color, gutter, radius, statusBarStyle } from '../theme';

interface VendorTermsAndPrivacyScreenProps {
  onNavigateBack: () => void;
}

export const VendorTermsAndPrivacyScreen: React.FC<VendorTermsAndPrivacyScreenProps> = ({ onNavigateBack }) => {
  const { settings } = useAppSettings();
  const [tab, setTab] = useState<'terms' | 'privacy'>('terms');
  const sections = tab === 'terms' ? vendorAgreement(settings) : vendorPrivacy;

  return (
    <Screen>
      <StatusBar style={statusBarStyle()} />
      <ScreenHeader title="Agreement and privacy" onBack={onNavigateBack} />
      <Segmented
        options={[
          { key: 'terms', label: 'Vendor agreement' },
          { key: 'privacy', label: 'Privacy' },
        ]}
        value={tab}
        onChange={setTab}
        style={{ marginHorizontal: gutter, marginBottom: 12 }}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 40 }}>
        {sections.map((s) => (
          <View key={s.title} style={{ padding: 16, marginBottom: 10, borderRadius: radius.xl, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border }}>
            <AppText variant="subheading" style={{ marginBottom: 6 }}>
              {s.title}
            </AppText>
            <AppText variant="body" color={color.text}>
              {s.body}
            </AppText>
          </View>
        ))}
        <AppText variant="small" color={color.subtle} style={{ marginTop: 6 }}>
          Last updated {AGREEMENT_UPDATED}. Questions? Email support@escardia.com.
        </AppText>
      </ScrollView>
    </Screen>
  );
};

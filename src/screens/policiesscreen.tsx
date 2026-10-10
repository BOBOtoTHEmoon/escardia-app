import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Chip } from '../components/filtermodal';
import { AppText, Screen, ScreenHeader } from '../ui';
import { color, gutter, radius, themed, statusBarStyle } from '../theme';

interface PoliciesScreenProps {
  onNavigateBack: () => void;
}

type Key = 'safety' | 'privacy' | 'payment' | 'conduct';

// Have these reviewed by a lawyer before launch. They describe only what the app does today.
const POLICIES: Record<Key, { title: string; paragraphs: string[] }> = {
  safety: {
    title: 'Safety policy',
    paragraphs: [
      'Safety is at the core of Escardia. Every trip booked through our platform must put the well-being of passengers, drivers and security personnel first. This policy explains how we keep users safe and how we handle incidents.',
      'Escardia checks every vendor before they can list cars, including their identity and business documents. Every car and its photos are reviewed and approved by Escardia before customers can see it. Vendors are responsible for the drivers and security personnel they assign, who must be properly vetted and licensed.',
      'Every trip is recorded with the vendor, driver, car and times. You can call or text your driver and vendor from the trip screen, and you can report a problem during the trip or within 24 hours after it ends. When you report a problem, the vendor is not paid until Escardia has reviewed it.',
      'Escardia has zero tolerance for unsafe behaviour, including reckless driving, harassment and intoxication. Report incidents in the app or contact our support team. All reports are handled confidentially.',
    ],
  },
  privacy: {
    title: 'Privacy policy',
    paragraphs: [
      'Protecting your information matters to us as much as physical safety. This policy explains how we collect, use, store and protect the personal information of everyone who uses Escardia.',
      'When you sign up we ask for your name, email and phone number. We use this only to run the service: to manage your bookings, let your driver and vendor reach you, and process payments. Escardia never sells personal data.',
      'Your data is encrypted in transit and at rest. Payments are handled by Paystack, a PCI-DSS compliant payment processor, so your card details are never stored on Escardia’s servers. Vendor identity documents are stored privately and only Escardia staff can view them.',
      'If you allow it, the app uses your location to suggest nearby areas. We do not track your location in the background.',
      'We share information only when it is needed to complete your trip (for example, your name and phone number with your vendor and driver), with service providers such as our payment processor, or when the law requires it. We check that legal requests are valid before responding.',
    ],
  },
  payment: {
    title: 'Payment and refund policy',
    paragraphs: [
      'You pay for your trip in full before it starts, by card, bank transfer or USSD through Paystack, or from your Escardia wallet. The price shown on the Review and pay screen is confirmed by Escardia and does not change after you pay. It includes the car rental, any delivery, security and Hilux fees, and Escardia’s service fee.',
      'If you cancel, your refund depends on how long is left before pick-up: 24 hours or more, a full refund; 12 to 24 hours, 50%; 2 to 12 hours, 25%; less than 2 hours, no refund. If the vendor or Escardia cancels your trip, you get a full refund. Refunds are added to your Escardia wallet straight away.',
      'If something goes wrong, report it from the trip screen during the trip or within 24 hours after it ends. Escardia holds the vendor’s payment while we review it and may refund you all or part of what you paid. We tell both you and the vendor the outcome.',
      'Wallet money can be used for bookings on Escardia. For questions about a payment or your balance, contact support.',
    ],
  },
  conduct: {
    title: 'Driver and escort conduct',
    paragraphs: [
      'Drivers and security personnel are at the heart of Escardia. This policy sets out the standards of professionalism and behaviour they must keep.',
      'Punctuality is essential. Drivers must arrive on time at the agreed pick-up point and escorts must be ready from the start of the trip. Repeated lateness may lead to the vendor being suspended.',
      'Drivers and escorts must treat passengers with respect at all times. Harassment, discrimination or unprofessional behaviour is not allowed and may lead to immediate suspension.',
      'Drivers and escorts should be neatly dressed, and cars must be clean inside and out.',
      'Drivers must obey all traffic laws, never drive recklessly and never drive under the influence of alcohol or drugs. Escorts must stay alert for the whole trip. Information about passengers must never be shared without their consent, and discretion is especially important with high-profile clients.',
    ],
  },
};

export const PoliciesScreen: React.FC<PoliciesScreenProps> = ({ onNavigateBack }) => {
  const [tab, setTab] = useState<Key>('safety');
  const p = POLICIES[tab];
  return (
    <Screen>
      <StatusBar style={statusBarStyle()} />
      <ScreenHeader title="Our policies" onBack={onNavigateBack} />
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: gutter, gap: 8, paddingBottom: 12 }}>
          <Chip label="Safety" active={tab === 'safety'} onPress={() => setTab('safety')} />
          <Chip label="Privacy" active={tab === 'privacy'} onPress={() => setTab('privacy')} />
          <Chip label="Payments and refunds" active={tab === 'payment'} onPress={() => setTab('payment')} />
          <Chip label="Driver conduct" active={tab === 'conduct'} onPress={() => setTab('conduct')} />
        </ScrollView>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 40 }}>
        <View style={styles.doc}>
          <AppText variant="heading">{p.title}</AppText>
          <AppText variant="small" color={color.subtle} style={{ marginTop: 2, marginBottom: 8 }}>
            Last updated October 2026
          </AppText>
          {p.paragraphs.map((t, i) => (
            <AppText key={i} variant="body" color={color.text} style={{ marginTop: 12, lineHeight: 23 }}>
              {t}
            </AppText>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = themed(() => StyleSheet.create({
  doc: { padding: 18, borderRadius: radius.xl, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border },
}));

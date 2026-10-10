import React from 'react';
import { Linking, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppText, Screen, ScreenHeader } from '../ui';
import { MenuGroup, MenuRow } from '../ui/Menu';
import { color, gutter, statusBarStyle } from '../theme';

/** One place for Escardia's contact details. */
export const CONTACT = {
  phone: '+2349116511460',
  phoneDisplay: '+234 911 651 1460',
  whatsapp: 'https://wa.me/2349116511460',
  email: 'contact@escardia.com',
  instagram: 'https://instagram.com/escardia.co',
  x: 'https://twitter.com/escardiaCo',
};

interface ContactUsScreenProps {
  onNavigateBack: () => void;
  onNavigateToChatWithUs?: () => void;
}

const open = (url: string) => Linking.openURL(url).catch(() => {});

export const ContactUsScreen: React.FC<ContactUsScreenProps> = ({ onNavigateBack }) => (
  <Screen>
    <StatusBar style={statusBarStyle()} />
    <ScreenHeader title="Contact us" onBack={onNavigateBack} />
    <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 40 }}>
      <AppText variant="body" color={color.muted} style={{ marginTop: 4 }}>
        Reach us any way you like. We reply fastest on WhatsApp.
      </AppText>
      <MenuGroup title="Direct">
        <MenuRow icon="message-circle" label="WhatsApp" hint="Chat with the Escardia team" onPress={() => open(CONTACT.whatsapp)} />
        <MenuRow icon="phone" label="Call us" hint={CONTACT.phoneDisplay} onPress={() => open(`tel:${CONTACT.phone}`)} />
        <MenuRow icon="mail" label="Email" hint={CONTACT.email} onPress={() => open(`mailto:${CONTACT.email}`)} last />
      </MenuGroup>
      <MenuGroup title="Social">
        <MenuRow icon="instagram" label="Instagram" hint="@escardia.co" onPress={() => open(CONTACT.instagram)} />
        <MenuRow icon="twitter" label="X" hint="@escardiaCo" onPress={() => open(CONTACT.x)} last />
      </MenuGroup>
    </ScrollView>
  </Screen>
);

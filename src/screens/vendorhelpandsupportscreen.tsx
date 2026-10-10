// Vendor help: contact Escardia, and answers that match how payouts, reviews and bookings really work.
import React, { useState } from 'react';
import { LayoutAnimation, Linking, Platform, Pressable, ScrollView, StyleSheet, UIManager, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { CONTACT } from './contactusscreen';
import { useAppSettings } from '../hooks/useAppSettings';
import { AppText, Screen, ScreenHeader } from '../ui';
import { naira } from '../ui/CarCard';
import { MenuGroup, MenuRow } from '../ui/Menu';
import { color, gutter, radius, themed, statusBarStyle } from '../theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) UIManager.setLayoutAnimationEnabledExperimental(true);

interface VendorHelpAndSupportScreenProps {
  onNavigateBack: () => void;
}

const open = (url: string) => Linking.openURL(url).catch(() => {});

export const VendorHelpAndSupportScreen: React.FC<VendorHelpAndSupportScreenProps> = ({ onNavigateBack }) => {
  const { settings } = useAppSettings();
  const [openQ, setOpenQ] = useState<string | null>(null);
  const pct = `${Math.round(settings.commissionRate * 1000) / 10}%`;

  const FAQS: { group: string; items: { q: string; a: string }[] }[] = [
    {
      group: 'Getting started',
      items: [
        {
          q: 'How long does approval take?',
          a: 'Escardia reviews your details and ID, then each car. You can add cars while your account is in review; they go live once both are approved. We notify you as soon as that happens.',
        },
        {
          q: 'Why is my car back in review?',
          a: 'Changing a car’s make, model, year or photos sends it back for review so customers always see accurate listings. Price and description changes do not.',
        },
        {
          q: 'How do I take a car off for a while?',
          a: 'Open the car in your fleet and switch off Taking bookings. Bookings you already have stay in place.',
        },
      ],
    },
    {
      group: 'Bookings',
      items: [
        {
          q: 'Do I need to accept bookings?',
          a: 'No. A booking only reaches you once the customer has paid, so it is confirmed straight away. Assign a driver to it as soon as you can.',
        },
        {
          q: 'How do I assign a driver?',
          a: 'Add your drivers under Account, then open the booking and tap Assign a driver. The customer then sees the driver’s name and number.',
        },
        {
          q: 'What if I have to cancel?',
          a: 'Open the booking and tap Cancel this booking before the trip starts. The customer gets a full refund and you are not paid for it. Cancelling often can get your account suspended.',
        },
        {
          q: 'When do I mark a trip as completed?',
          a: 'When the car is back. If you forget, Escardia completes the trip automatically at the booked return time.',
        },
      ],
    },
    {
      group: 'Money',
      items: [
        {
          q: 'How much does Escardia keep?',
          a: `${pct} of the car rental and any delivery fee. The customer’s service fee and security fees go to Escardia on top of your price, not out of your share.`,
        },
        {
          q: 'When can I withdraw?',
          a: `Your share is held until the trip ends, then for ${settings.payoutHoldHours} more hours so the customer can report a problem. After that it moves to your available balance.`,
        },
        {
          q: 'How do withdrawals work?',
          a: `Add a payout account, then withdraw from Earnings. Escardia reviews each withdrawal and sends it to your bank. The fee is ${naira(settings.withdrawalFee)} and the minimum is ${naira(settings.minWithdrawal)}. If a transfer fails, the money returns to your balance.`,
        },
        {
          q: 'What happens if a customer reports a problem?',
          a: 'Your payout for that trip is paused while Escardia looks into it. We may contact you, and we tell you the outcome and how much you are paid.',
        },
      ],
    },
  ];

  const toggle = (q: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenQ(openQ === q ? null : q);
  };

  return (
    <Screen>
      <StatusBar style={statusBarStyle()} />
      <ScreenHeader title="Help and support" onBack={onNavigateBack} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <MenuGroup title="Talk to us">
          <MenuRow icon="message-circle" label="WhatsApp" hint="Fastest way to reach the vendor team" onPress={() => open(CONTACT.whatsapp)} />
          <MenuRow icon="phone" label="Call us" hint={CONTACT.phoneDisplay} onPress={() => open(`tel:${CONTACT.phone}`)} />
          <MenuRow icon="mail" label="Email" hint={CONTACT.email} onPress={() => open(`mailto:${CONTACT.email}`)} last />
        </MenuGroup>

        {FAQS.map((g) => (
          <View key={g.group} style={{ marginTop: 22 }}>
            <AppText variant="caption" color={color.muted} style={{ marginBottom: 8, marginLeft: 4 }}>
              {g.group}
            </AppText>
            <View style={styles.group}>
              {g.items.map((f, i) => {
                const isOpen = openQ === f.q;
                return (
                  <Pressable key={f.q} onPress={() => toggle(f.q)} style={[styles.item, i < g.items.length - 1 && styles.border]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <AppText variant="bodyMedium" style={{ flex: 1 }}>
                        {f.q}
                      </AppText>
                      <Feather name={isOpen ? 'minus' : 'plus'} size={18} color={isOpen ? color.primary : color.subtle} />
                    </View>
                    {isOpen && (
                      <AppText variant="body" color={color.text} style={{ marginTop: 8 }}>
                        {f.a}
                      </AppText>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
};

const styles = themed(() => StyleSheet.create({
  group: { backgroundColor: color.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: color.border, overflow: 'hidden' },
  item: { paddingHorizontal: 16, paddingVertical: 14 },
  border: { borderBottomWidth: 1, borderBottomColor: color.border },
}));

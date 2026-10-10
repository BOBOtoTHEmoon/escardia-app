import React, { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, UIManager, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { AppText, Screen, ScreenHeader } from '../ui';
import { color, gutter, radius, themed, statusBarStyle } from '../theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) UIManager.setLayoutAnimationEnabledExperimental(true);

interface FAQScreenProps {
  onNavigateBack: () => void;
}

// Keep these in line with how the app and the database actually behave.
const FAQS: { group: string; items: { q: string; a: string }[] }[] = [
  {
    group: 'Booking',
    items: [
      {
        q: 'How do I book a car?',
        a: 'Find a car on the Cars tab, tap Book now, choose your dates and how you want to get the car, add security if you need it, then pay. Your trip shows up in My Trips straight away.',
      },
      {
        q: 'Does every car come with a driver?',
        a: 'Yes. Every Escardia trip includes a professional driver supplied by the vendor. Self-drive is coming later.',
      },
      {
        q: 'How far ahead do I need to book?',
        a: 'At least a few hours before pick-up so the vendor can prepare the car. The app shows the earliest time you can choose.',
      },
      {
        q: 'Can the car come to me?',
        a: 'Yes. Choose Deliver to me when booking and enter your address. A delivery fee is added and shown before you pay.',
      },
      {
        q: 'Can I add security?',
        a: 'Yes. On the Security step you can add LEGION or PRIVATE personnel. Teams of 3 or more need a Hilux backup vehicle, which the app adds for you. Security is priced per person, per day.',
      },
    ],
  },
  {
    group: 'Payments and refunds',
    items: [
      {
        q: 'How can I pay?',
        a: 'By card, bank transfer or USSD through Paystack, or from your Escardia wallet. Escardia never sees your card details.',
      },
      {
        q: 'Is the price fixed?',
        a: 'Yes. The price on the Review and pay screen is confirmed by Escardia before you pay and does not change after.',
      },
      {
        q: 'What happens if I cancel?',
        a: 'Cancel 24 hours or more before pick-up for a full refund. From 12 to 24 hours before you get 50% back, from 2 to 12 hours before you get 25%, and nothing in the last 2 hours. Refunds go to your Escardia wallet straight away.',
      },
      {
        q: 'Can I change my trip after paying?',
        a: 'Paid trips cannot be edited in the app because the price and availability would change. Cancel and book again, or contact support and we will help.',
      },
      {
        q: 'How do I top up my wallet?',
        a: 'Go to Profile, then Wallet, then Add money. Pay with Paystack and the money is added as soon as it clears.',
      },
    ],
  },
  {
    group: 'During and after your trip',
    items: [
      {
        q: 'How do I reach my driver or vendor?',
        a: 'Open the trip in My Trips. You can call or text your driver and the vendor from there.',
      },
      {
        q: 'Something went wrong on my trip. What do I do?',
        a: 'Open the trip and tap Report a problem. You can do this during the trip or up to 24 hours after it ends. The vendor is not paid until Escardia has looked into it, and we may refund you to your wallet.',
      },
      {
        q: 'How are vendors and cars checked?',
        a: 'Escardia checks every vendor’s ID and business documents and approves every car and its photos before customers can see it.',
      },
    ],
  },
];

export const FAQScreen: React.FC<FAQScreenProps> = ({ onNavigateBack }) => {
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (q: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(open === q ? null : q);
  };
  return (
    <Screen>
      <StatusBar style={statusBarStyle()} />
      <ScreenHeader title="FAQs" onBack={onNavigateBack} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {FAQS.map((g) => (
          <View key={g.group} style={{ marginTop: 18 }}>
            <AppText variant="caption" color={color.muted} style={{ marginBottom: 8, marginLeft: 4 }}>
              {g.group}
            </AppText>
            <View style={styles.group}>
              {g.items.map((f, i) => {
                const isOpen = open === f.q;
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

import React from 'react';
import { ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { auth } from '../config/supabase';
import { AppText, Screen, ScreenHeader } from '../ui';
import { MenuGroup, MenuRow } from '../ui/Menu';
import { color, gutter, statusBarStyle } from '../theme';

interface SecurityLoginSafetyScreenProps {
  onNavigateBack: () => void;
  onNavigateToChangePassword: () => void;
  onNavigateToSafetyTips: () => void;
}

export const SecurityLoginSafetyScreen: React.FC<SecurityLoginSafetyScreenProps> = ({ onNavigateBack, onNavigateToChangePassword, onNavigateToSafetyTips }) => (
  <Screen>
    <StatusBar style={statusBarStyle()} />
    <ScreenHeader title="Password and safety" onBack={onNavigateBack} />
    <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 40 }}>
      <MenuGroup title="Sign in">
        <MenuRow icon="mail" label="Email" hint={auth.currentUser?.email ?? ''} />
        <MenuRow icon="lock" label="Change password" hint="Use a strong password you don't use elsewhere" onPress={onNavigateToChangePassword} last />
      </MenuGroup>
      <MenuGroup title="Safety">
        <MenuRow icon="shield" label="Safety tips" hint="How to stay safe on every trip" onPress={onNavigateToSafetyTips} last />
      </MenuGroup>
      <AppText variant="small" color={color.muted} style={{ marginTop: 18, paddingHorizontal: 4 }}>
        Escardia will never ask for your password, card PIN or one-time codes by phone, text or email.
      </AppText>
    </ScrollView>
  </Screen>
);

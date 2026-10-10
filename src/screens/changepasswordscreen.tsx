import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { changePassword } from '../services/authservice';
import { AppText, Banner, Button, Screen, ScreenHeader, TextField } from '../ui';
import { color, gutter, statusBarStyle } from '../theme';

interface ChangePasswordScreenProps {
  onNavigateBack: () => void;
  onPasswordChanged: () => void;
}

const RULES = [
  { label: '8 or more characters', test: (p: string) => p.length >= 8 },
  { label: 'A number', test: (p: string) => /\d/.test(p) },
  { label: 'A special character, like ! or @', test: (p: string) => /[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\/;']/.test(p) },
];

export const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({ onNavigateBack, onPasswordChanged }) => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setError('');
    if (!current) return setError('Enter your current password');
    if (!RULES.every((r) => r.test(next))) return setError('Your new password needs everything in the list');
    if (next !== again) return setError('The new passwords do not match');
    if (next === current) return setError('Choose a password different from your current one');
    setSaving(true);
    const r = await changePassword(current, next);
    setSaving(false);
    if (!r.success) return setError(r.error || 'Could not change your password');
    Alert.alert('Password changed', 'Use your new password next time you sign in.', [{ text: 'OK', onPress: onPasswordChanged }]);
  };

  return (
    <Screen>
      <StatusBar style={statusBarStyle()} />
      <ScreenHeader title="Change password" onBack={onNavigateBack} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingTop: 8, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {!!error && <Banner text={error} />}
          <TextField label="Current password" icon="lock" value={current} onChangeText={setCurrent} isPassword autoComplete="password" textContentType="password" />
          <TextField
            label="New password"
            icon="lock"
            value={next}
            onChangeText={setNext}
            isPassword
            autoComplete="new-password"
            textContentType="newPassword"
            containerStyle={{ marginBottom: 10 }}
          />
          <View style={{ gap: 6, marginBottom: 18 }}>
            {RULES.map((r) => {
              const ok = r.test(next);
              return (
                <View key={r.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Feather name={ok ? 'check-circle' : 'circle'} size={14} color={ok ? color.success : color.borderStrong} />
                  <AppText variant="small" color={ok ? color.ink : color.muted}>
                    {r.label}
                  </AppText>
                </View>
              );
            })}
          </View>
          <TextField label="Confirm new password" icon="lock" value={again} onChangeText={setAgain} isPassword autoComplete="new-password" textContentType="newPassword" containerStyle={{ marginBottom: 24 }} />
          <Button title="Update password" onPress={save} loading={saving} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

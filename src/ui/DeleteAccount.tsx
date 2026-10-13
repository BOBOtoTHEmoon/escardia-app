// "Delete account" row and the sheet behind it. Used on the customer and vendor profile screens.
import React, { useState } from 'react';
import { ActivityIndicator, Linking, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppText, Banner, Button, TextField } from './index';
import { BottomSheet } from './Kit';
import { MenuRow } from './Menu';
import { CONTACT } from '../screens/contactusscreen';
import { checkAccountDeletion, deleteMyAccount } from '../services/accountService';
import { color } from '../theme';

type Step = 'checking' | 'blocked' | 'confirm';

const LOSES = [
  'Your name, email, phone number and photo',
  'Saved cars and notifications',
  'For vendors: your ID, documents, bank details, drivers and car listings',
];

export const DeleteAccountRow = ({ onDeleted, last }: { onDeleted: () => void; last?: boolean }) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('checking');
  const [reason, setReason] = useState('');
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const start = async () => {
    setOpen(true);
    setStep('checking');
    setTyped('');
    setError('');
    const r = await checkAccountDeletion();
    if (r.ok) setStep('confirm');
    else {
      setReason(r.reason || 'Your account cannot be deleted right now.');
      setStep('blocked');
    }
  };

  const confirm = async () => {
    setDeleting(true);
    setError('');
    const r = await deleteMyAccount();
    setDeleting(false);
    if (!r.success) return setError(r.error || 'Please try again.');
    setOpen(false);
    onDeleted();
  };

  const close = () => !deleting && setOpen(false);

  return (
    <>
      <MenuRow icon="trash-2" label="Delete account" danger onPress={start} right={<View />} last={last} />

      <BottomSheet
        visible={open}
        onClose={close}
        title="Delete your account?"
        subtitle={step === 'confirm' ? 'This cannot be undone.' : undefined}
      >
        {step === 'checking' && (
          <View style={{ paddingVertical: 28, alignItems: 'center' }}>
            <ActivityIndicator color={color.primary} />
          </View>
        )}

        {step === 'blocked' && (
          <>
            <Banner tone="info" text={reason} />
            <Button
              title="Chat with us on WhatsApp"
              icon="message-circle"
              variant="secondary"
              onPress={() => Linking.openURL(CONTACT.whatsapp).catch(() => {})}
              style={{ marginTop: 14 }}
            />
            <Button title="Close" variant="ghost" onPress={close} style={{ marginTop: 6 }} />
          </>
        )}

        {step === 'confirm' && (
          <>
            <AppText variant="smallMedium" color={color.text} style={{ marginBottom: 8 }}>
              We will permanently delete:
            </AppText>
            {LOSES.map((l) => (
              <View key={l} style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
                <Feather name="x-circle" size={15} color={color.danger} style={{ marginTop: 2 }} />
                <AppText variant="small" color={color.text} style={{ flex: 1 }}>
                  {l}
                </AppText>
              </View>
            ))}
            <AppText variant="small" color={color.muted} style={{ marginTop: 6, marginBottom: 16 }}>
              Records of past trips and payments are kept without your contact details, as the law requires.
            </AppText>

            <TextField
              label="Type DELETE to confirm"
              value={typed}
              onChangeText={setTyped}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="DELETE"
              error={error || undefined}
            />
            <Button
              title="Delete my account"
              variant="danger"
              icon="trash-2"
              onPress={confirm}
              loading={deleting}
              disabled={typed.trim().toUpperCase() !== 'DELETE'}
            />
            <Button title="Keep my account" variant="ghost" onPress={close} disabled={deleting} style={{ marginTop: 6 }} />
          </>
        )}
      </BottomSheet>
    </>
  );
};

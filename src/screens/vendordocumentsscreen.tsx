// Vendor documents: see what Escardia has on file and add or replace a photo.
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { getDocuments, replaceDocument, DocKey, VendorDocs } from '../services/vendorService';
import { AppText, Screen, ScreenHeader } from '../ui';
import { UploadBox } from '../ui/Kit';
import { color, gutter, radius, themed, statusBarStyle } from '../theme';

interface VendorDocumentsScreenProps {
  onNavigateBack: () => void;
}

const ID_NAME: Record<string, string> = { 'national-id': 'National ID', passport: 'Passport', 'voters-card': "Voter's card" };

export const VendorDocumentsScreen: React.FC<VendorDocumentsScreenProps> = ({ onNavigateBack }) => {
  const [docs, setDocs] = useState<VendorDocs | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<DocKey | null>(null);

  const load = useCallback(async () => {
    setDocs(await getDocuments());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const replace = async (key: DocKey, uri: string | null) => {
    if (!uri) return; // Documents cannot be removed from here, only replaced.
    setUploading(key);
    const r = await replaceDocument(key, uri);
    setUploading(null);
    if (!r.success) return Alert.alert('Upload failed', r.error || 'Please try again.');
    load();
  };

  const passport = docs?.idType === 'passport';
  const slots: { key: DocKey; label: string; hint: string; optional?: boolean }[] = [
    { key: 'idFront', label: passport ? 'Passport photo page' : 'ID front', hint: 'A clear photo with all four corners showing.' },
    ...(passport ? [] : [{ key: 'idBack' as DocKey, label: 'ID back', hint: 'A clear photo with all four corners showing.' }]),
    { key: 'cac', label: 'CAC certificate', hint: 'For registered businesses.', optional: true },
    { key: 'proofOfAddress', label: 'Proof of address', hint: 'A recent utility bill or bank statement.', optional: true },
  ];

  return (
    <Screen>
      <StatusBar style={statusBarStyle()} />
      <ScreenHeader title="Documents" subtitle="Only Escardia's review team can see these" onBack={onNavigateBack} />
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={color.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 40 }}>
          <View style={styles.idCard}>
            <View style={styles.idIcon}>
              <Feather name="credit-card" size={18} color={color.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="small" color={color.muted}>
                ID on file
              </AppText>
              <AppText variant="bodyMedium">{ID_NAME[docs?.idType ?? ''] ?? 'Not added yet'}</AppText>
              {!!docs?.nin && (
                <AppText variant="small" color={color.muted}>
                  NIN ending {docs.nin.slice(-4)}
                </AppText>
              )}
            </View>
          </View>

          {slots.map((s) => (
            <UploadBox
              key={s.key}
              label={s.label}
              hint={s.hint}
              optional={s.optional}
              uri={docs?.files[s.key]?.url ?? null}
              onChange={(u) => replace(s.key, u)}
              loading={uploading === s.key}
              removable={false}
            />
          ))}

          <View style={styles.note}>
            <Feather name="lock" size={14} color={color.success} />
            <AppText variant="small" color={color.text} style={{ flex: 1 }}>
              Documents are stored privately. Customers never see them. To change your ID type, contact support.
            </AppText>
          </View>
        </ScrollView>
      )}
    </Screen>
  );
};

const styles = themed(() => StyleSheet.create({
  idCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 18, borderRadius: radius.xl, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border },
  idIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: color.primarySoft, alignItems: 'center', justifyContent: 'center' },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 4, paddingHorizontal: 4 },
}));

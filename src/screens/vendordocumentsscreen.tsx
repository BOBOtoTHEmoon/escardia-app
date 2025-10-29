import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, spacing, borderRadius } from '../constants';

interface VendorDocumentsScreenProps {
  onNavigateBack: () => void;
}

export const VendorDocumentsScreen: React.FC<VendorDocumentsScreenProps> = ({
  onNavigateBack,
}) => {
  const [documents, setDocuments] = useState({
    idFront: null as string | null,
    idBack: null as string | null,
    cacCertificate: null as string | null,
    proofOfAddress: null as string | null,
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const { db, auth } = await import('../config/firebase');
      const { doc, getDoc } = await import('firebase/firestore');
      
      const vendorId = auth.currentUser?.uid;
      if (!vendorId) return;

      const vendorDoc = await getDoc(doc(db, 'vendors', vendorId));
      if (vendorDoc.exists()) {
        const data = vendorDoc.data();
        setDocuments({
          idFront: data.idFront || null,
          idBack: data.idBack || null,
          cacCertificate: data.cacCertificate || null,
          proofOfAddress: data.proofOfAddress || null,
        });
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadToCloudinary = async (uri: string) => {
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'image/jpeg',
      name: 'document.jpg',
    } as any);
    formData.append('upload_preset', 'escardia');

    const response = await fetch(
      'https://api.cloudinary.com/v1_1/dsrd8cgse/image/upload',
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();
    return data.secure_url;
  };

  const pickDocument = async (type: 'idFront' | 'idBack' | 'cacCertificate' | 'proofOfAddress') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        const uploadedUrl = await uploadToCloudinary(result.assets[0].uri);

        // Save to Firebase
        const { db, auth } = await import('../config/firebase');
        const { doc, updateDoc } = await import('firebase/firestore');
        
        const vendorId = auth.currentUser?.uid;
        if (!vendorId) return;

        await updateDoc(doc(db, 'vendors', vendorId), {
          [type]: uploadedUrl,
          updatedAt: new Date().toISOString(),
        });

        setDocuments(prev => ({ ...prev, [type]: uploadedUrl }));
        Alert.alert('Success', 'Document uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      Alert.alert('Error', 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const DocumentCard = ({ 
    title, 
    description, 
    type, 
    imageUrl 
  }: { 
    title: string; 
    description: string; 
    type: 'idFront' | 'idBack' | 'cacCertificate' | 'proofOfAddress';
    imageUrl: string | null;
  }) => (
    <View style={styles.documentCard}>
      <View style={styles.documentHeader}>
        <View>
          <Text style={styles.documentTitle}>{title}</Text>
          <Text style={styles.documentDescription}>{description}</Text>
        </View>
        {imageUrl ? (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ Uploaded</Text>
          </View>
        ) : (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>Pending</Text>
          </View>
        )}
      </View>

      {imageUrl ? (
        <View style={styles.documentImageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.documentImage} />
          <TouchableOpacity
            style={styles.reuploadButton}
            onPress={() => pickDocument(type)}
          >
            <Text style={styles.reuploadText}>Replace</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => pickDocument(type)}
        >
          <Text style={styles.uploadIcon}>📤</Text>
          <Text style={styles.uploadText}>Upload Document</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Documents</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Documents</Text>
        <View style={styles.headerSpacer} />
      </View>

      {uploading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.uploadingText}>Uploading...</Text>
        </View>
      )}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📄 Verification Documents</Text>
          <Text style={styles.sectionSubtitle}>
            Upload your documents to verify your vendor account
          </Text>

          <DocumentCard
            title="ID Card (Front)"
            description="Front side of your National ID, Driver's License, or Passport"
            type="idFront"
            imageUrl={documents.idFront}
          />

          <DocumentCard
            title="ID Card (Back)"
            description="Back side of your ID document"
            type="idBack"
            imageUrl={documents.idBack}
          />

          <DocumentCard
            title="CAC Certificate"
            description="Certificate of Incorporation (if registered business)"
            type="cacCertificate"
            imageUrl={documents.cacCertificate}
          />

          <DocumentCard
            title="Proof of Address"
            description="Utility bill, bank statement, or tenancy agreement"
            type="proofOfAddress"
            imageUrl={documents.proofOfAddress}
          />

          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <Text style={styles.infoText}>
              All documents will be reviewed by our team. Verification typically takes 24-48 hours.
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
  },
  backIcon: {
    fontSize: 24,
    color: colors.text,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  uploadingText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.base,
    marginTop: spacing.md,
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  documentCard: {
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  documentTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: 4,
  },
  documentDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    maxWidth: '70%',
  },
  verifiedBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  verifiedText: {
    fontSize: typography.fontSize.xs,
    color: colors.textWhite,
    fontWeight: typography.fontWeight.semiBold,
  },
  pendingBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  pendingText: {
    fontSize: typography.fontSize.xs,
    color: colors.textWhite,
    fontWeight: typography.fontWeight.semiBold,
  },
  documentImageContainer: {
    position: 'relative',
  },
  documentImage: {
    width: '100%',
    height: 150,
    borderRadius: borderRadius.md,
  },
  reuploadButton: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  reuploadText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
  },
  uploadButton: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  uploadIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  uploadText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '15',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 40,
  },
});
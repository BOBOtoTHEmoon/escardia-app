import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../constants';

interface VendorTermsAndPrivacyScreenProps {
  onNavigateBack: () => void;
}

export const VendorTermsAndPrivacyScreen: React.FC<VendorTermsAndPrivacyScreenProps> = ({
  onNavigateBack,
}) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Privacy</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📜 Terms of Service</Text>
          <Text style={styles.paragraph}>
            Welcome to Escardia Vendor Platform. By using our services, you agree to these terms.
          </Text>

          <Text style={styles.subheading}>1. Vendor Responsibilities</Text>
          <Text style={styles.paragraph}>
            • You must provide accurate information about your vehicles{'\n'}
            • Maintain vehicles in good working condition{'\n'}
            • Respond to bookings promptly{'\n'}
            • Honor confirmed bookings unless exceptional circumstances arise
          </Text>

          <Text style={styles.subheading}>2. Commission & Payments</Text>
          <Text style={styles.paragraph}>
            • Escardia charges a 15% commission on each booking{'\n'}
            • Payments are processed within 3-5 business days{'\n'}
            • Vendors are responsible for applicable taxes
          </Text>

          <Text style={styles.subheading}>3. Cancellation Policy</Text>
          <Text style={styles.paragraph}>
            • Free cancellation up to 24 hours before pickup{'\n'}
            • Late cancellations may incur penalties{'\n'}
            • Multiple cancellations may affect your account standing
          </Text>

          <Text style={styles.subheading}>4. Insurance & Liability</Text>
          <Text style={styles.paragraph}>
            • Vendors must maintain valid insurance{'\n'}
            • Escardia is not liable for damages during rentals{'\n'}
            • Disputes should be resolved between vendor and customer
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 Privacy Policy</Text>
          <Text style={styles.paragraph}>
            Your privacy is important to us. This policy explains how we collect and use your data.
          </Text>

          <Text style={styles.subheading}>Information We Collect</Text>
          <Text style={styles.paragraph}>
            • Personal details (name, email, phone){'\n'}
            • Business information{'\n'}
            • Vehicle details and photos{'\n'}
            • Booking and transaction history{'\n'}
            • Device and usage information
          </Text>

          <Text style={styles.subheading}>How We Use Your Data</Text>
          <Text style={styles.paragraph}>
            • To facilitate bookings and payments{'\n'}
            • To improve our services{'\n'}
            • To communicate important updates{'\n'}
            • To prevent fraud and ensure security
          </Text>

          <Text style={styles.subheading}>Data Sharing</Text>
          <Text style={styles.paragraph}>
            • We share limited data with customers (vehicle info, location){'\n'}
            • We never sell your personal information{'\n'}
            • We may share data with law enforcement if required
          </Text>

          <Text style={styles.subheading}>Your Rights</Text>
          <Text style={styles.paragraph}>
            • Access your data at any time{'\n'}
            • Request data deletion{'\n'}
            • Opt-out of marketing communications{'\n'}
            • Update or correct your information
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.contactInfo}>
            For questions about these terms or our privacy policy, contact us at:{'\n\n'}
            📧 support@escardia.com{'\n'}
            📞 +234 800 000 0000
          </Text>
          
          <Text style={styles.updateText}>
            Last updated: October 21, 2025
          </Text>
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
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  subheading: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  paragraph: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.lg,
  },
  contactInfo: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: 22,
    backgroundColor: colors.backgroundGray,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  updateText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  bottomSpacing: {
    height: 40,
  },
});
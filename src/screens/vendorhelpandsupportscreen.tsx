import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../constants';

interface VendorHelpAndSupportScreenProps {
  onNavigateBack: () => void;
}

export const VendorHelpAndSupportScreen: React.FC<VendorHelpAndSupportScreenProps> = ({
  onNavigateBack,
}) => {
  const handleContactSupport = (method: 'email' | 'phone' | 'whatsapp') => {
    switch (method) {
      case 'email':
        Linking.openURL('mailto:vendor-support@escardia.com');
        break;
      case 'phone':
        Linking.openURL('tel:+2348000000000');
        break;
      case 'whatsapp':
        Linking.openURL('https://wa.me/2348000000000');
        break;
    }
  };

  const faqItems = [
    {
      question: 'How do I add a new car to my fleet?',
      answer: 'Go to your dashboard and tap "Add Car". Fill in the vehicle details, upload photos, and set your pricing.',
    },
    {
      question: 'When do I receive payments?',
      answer: 'Payments are processed within 3-5 business days after a booking is completed.',
    },
    {
      question: 'What is the commission rate?',
      answer: 'Escardia charges a 5% commission on each successful booking.',
    },
    {
      question: 'How do I handle cancellations?',
      answer: 'If a customer cancels, you\'ll be notified immediately. Cancellations made 24+ hours before pickup have no penalties.',
    },
    {
      question: 'Can I edit my car details after listing?',
      answer: 'Yes! Go to Fleet → Select your car → Edit. You can update photos, pricing, and availability anytime.',
    },
    {
      question: 'What if my car gets damaged?',
      answer: 'Report damage immediately through the app. Insurance claims should be filed according to your policy.',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Contact Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📞 Contact Us</Text>
          
          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => handleContactSupport('email')}
          >
            <View style={styles.contactIcon}>
              <Text style={styles.contactIconText}>📧</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Email Support</Text>
              <Text style={styles.contactSubtitle}>vendor-support@escardia.com</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => handleContactSupport('phone')}
          >
            <View style={styles.contactIcon}>
              <Text style={styles.contactIconText}>📱</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Phone Support</Text>
              <Text style={styles.contactSubtitle}>+234 800 000 0000</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => handleContactSupport('whatsapp')}
          >
            <View style={styles.contactIcon}>
              <Text style={styles.contactIconText}>💬</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>WhatsApp</Text>
              <Text style={styles.contactSubtitle}>Chat with us instantly</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* FAQs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>❓ Frequently Asked Questions</Text>
          
          {faqItems.map((item, index) => (
            <View key={index} style={styles.faqCard}>
              <Text style={styles.faqQuestion}>{item.question}</Text>
              <Text style={styles.faqAnswer}>{item.answer}</Text>
            </View>
          ))}
        </View>

        {/* Resources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 Resources</Text>
          
          <TouchableOpacity
            style={styles.resourceCard}
            onPress={() => Alert.alert('Coming Soon', 'Vendor guide coming soon!')}
          >
            <Text style={styles.resourceIcon}>📖</Text>
            <View style={styles.resourceInfo}>
              <Text style={styles.resourceTitle}>Vendor Guide</Text>
              <Text style={styles.resourceSubtitle}>Complete guide to using the platform</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resourceCard}
            onPress={() => Alert.alert('Coming Soon', 'Video tutorials coming soon!')}
          >
            <Text style={styles.resourceIcon}>🎥</Text>
            <View style={styles.resourceInfo}>
              <Text style={styles.resourceTitle}>Video Tutorials</Text>
              <Text style={styles.resourceSubtitle}>Learn how to maximize your earnings</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
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
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  contactIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  contactIconText: {
    fontSize: 24,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  arrow: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  faqCard: {
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  faqQuestion: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  faqAnswer: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  resourceIcon: {
    fontSize: 30,
    marginRight: spacing.md,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text,
    marginBottom: 4,
  },
  resourceSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  bottomSpacing: {
    height: 40,
  },
});
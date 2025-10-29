import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface PoliciesScreenProps {
  onNavigateBack: () => void;
}

export const PoliciesScreen: React.FC<PoliciesScreenProps> = ({ onNavigateBack }) => {
  const [activeTab, setActiveTab] = useState<'safety' | 'privacy' | 'payment' | 'driver'>('safety');

  const safetyPolicy = `Safety is at the very core of Escardia's mission. Every ride booked through our platform must prioritize the well-being of passengers, drivers, and escort/guards. This policy outlines the essential measures that safeguard its users, what measures we take to prevent them, and how incidents are handled when they arise.

Escardia implements strict background checks for all drivers and security escorts before they are allowed to operate on the platform. Background verification includes identity validation, driving record history, and—where applicable—criminal background screenings to ensure that no user is exposed to individuals who may pose a risk, addition, security escorts undergo specialized vetting processes where we assess not just their professional certifications but also their behavioral and interpersonal skills, because safety is not only about physical security but also about trust and comfort during the ride.

Our real-time ride tracking system is another layer of protection. Once a trip begins, users can share live trip status with friends or family members, ensuring visibility into the journey. This brings transparency, both accountability for the driver and reassurance for the passenger. In case of deviations from the designated route, both Escardia and the passenger receive alerts to immediately address any irregularities.

Escardia also enforces a zero-tolerance policy toward unsafe behavior. This includes reckless driving, harassment, intoxication, or any action that may compromise passenger comfort. If such a violation occurs, users can report the incident via the in-app reporting system or directly contact our 24/7 support line. All reports are handled with strict confidentiality.`;

  const privacyPolicy = `Escardia understands that in today's digital age, protecting user data is as critical as physical safety. Our Privacy Policy defines how we collect, use, store, and secure the personal information of every rider, driver, and escort that their personal information remains confidential and secure.

When a user signs up for Escardia, certain personal information is required, such their name, contact number, and payment details. This data is collected solely to deliver our services effectively—such as booking rides, enabling communications, and processing payments. Escardia never sells personal data to third parties.

All data is stored securely using end-to-end encryption. Payment details are handled through trusted, PCI-DSS compliant payment processors, ensuring that sensitive information like card numbers is never stored directly on our servers. Additionally, we employ advanced monitoring particularly when generating insights or analytics for platform improvement, so that individual identities are not compromised.

Location data is a vital part of Escardia's services. It helps drivers arrive efficiently and passengers track services during an active trip or when the app is in use for ride booking or to view historical trips. We do not track location passively in the background without consent.

Escardia is also transparent about data-sharing situations. For example, when required by law or government authorities, we may disclose certain data. Additionally, if using the legality of such requests are verified, and objections—where legally valid—are raised. Any third-party service providers (like payment gateways or name and location points—are never disclosed to third parties shared with drivers should be.`;

  const paymentPolicy = `Transparent and fair financial practices form the backbone of trust between Escardia and its users. This policy explains how payments are processed, the options available to riders, and the conditions under which refunds or disputes are granted.

Escardia supports multiple secure payment options including debit/credit cards, mobile wallets, and integrated bank transfers. All payments are processed through certified, encrypted gateways that comply with international payment standards, ensuring both safety and convenience.

Fares are calculated based on distance, time, type of vehicle, and any additional services such as guards or escorts. To prevent surprises, Escardia provides an upfront price estimation before the ride is confirmed. Once the trip is completed, users receive an electronic receipt detailing the breakdown, including base fare, surge (if applicable), and taxes.

Our refund policy is designed to be fair. If a ride is cancelled by the driver or if the service provided does not meet the expected quality standards, passengers may be eligible for either a full or partial refund. Refund claims must be filed within 48 hours, and decisions are communicated within 3-5 business days. Each claim is reviewed carefully, with outcomes communicated transparently to ensure fairness.

In cases where users cancel rides, refund eligibility depends on timing. Cancelling within the first few minutes after booking usually incurs no penalty, but cancellations closer to or after the pickup time or at the driver's arrival at the pick-up location may result in a cancellation fee to compensate the driver's time and effort.`;

  const driverPolicy = `Drivers and escorts are at the heart of Escardia's service. This policy outlines the standards of professionalism, behavior, and service that drivers and escorts using the platform must uphold.

FPunctuality is non-negotiable. Drivers are expected to arrive on time at the designated pick-up point, while escorts must be prepared to provide immediate assistance without delays. Consistent lateness may lead to penalties or removal from the platform. Professionalism and courtesy define every interaction.

Drivers and escorts must treat passengers with respect, maintain appropriate language, and create a welcoming environment. Harassment, discrimination, or unprofessional behavior is strictly prohibited and may lead to immediate suspension.

Appearance and hygiene also play a crucial role. Drivers and escorts should present themselves in neat attire, and vehicles must be clean at all times. The interior of the car should be free from unpleasant odors and debris, not just comfort but also confidence in the service quality.

Another key aspect is safety compliance. Drivers must obey all traffic laws, avoid reckless driving, and never operate vehicles under the influence of substances. Escorts must remain vigilant, particularly during high-risk trips, throughout the trip, ensuring the passenger feels secure. Escorts are also briefed and regularly retrained about passengers during rides must never be shared without explicit consent. Discretion is particularly important when handling high-profile clients or sensitive trips.

By clearly defining these conduct rules, Escardia guarantees that passengers enjoy a reliable, respectful, and secure ride every time.`;

  const renderContent = () => {
    switch (activeTab) {
      case 'safety':
        return safetyPolicy;
      case 'privacy':
        return privacyPolicy;
      case 'payment':
        return paymentPolicy;
      case 'driver':
        return driverPolicy;
      default:
        return safetyPolicy;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Our Policies</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'safety' && styles.activeTab]}
            onPress={() => setActiveTab('safety')}
          >
            <Text style={[styles.tabText, activeTab === 'safety' && styles.activeTabText]}>
              Safety Policy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'privacy' && styles.activeTab]}
            onPress={() => setActiveTab('privacy')}
          >
            <Text style={[styles.tabText, activeTab === 'privacy' && styles.activeTabText]}>
              Privacy Policy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'payment' && styles.activeTab]}
            onPress={() => setActiveTab('payment')}
          >
            <Text style={[styles.tabText, activeTab === 'payment' && styles.activeTabText]}>
              Payment and Refund Policy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'driver' && styles.activeTab]}
            onPress={() => setActiveTab('driver')}
          >
            <Text style={[styles.tabText, activeTab === 'driver' && styles.activeTabText]}>
              Driver and Escort Conduct Policy
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView style={styles.policyContent}>
        <Text style={styles.policyText}>{renderContent()}</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#000',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#0066FF',
  },
  tabText: {
    fontSize: 13,
    color: '#666',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  policyContent: {
    flex: 1,
    padding: 20,
  },
  policyText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
    textAlign: 'justify',
  },
});
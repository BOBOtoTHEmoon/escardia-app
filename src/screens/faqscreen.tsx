import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface FAQScreenProps {
  onNavigateBack: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
}

export const FAQScreen: React.FC<FAQScreenProps> = ({ onNavigateBack }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: 'How do I book a ride?',
      answer: 'Booking a ride on Escardia is simple and fast. Open the app and enter your pick-up and drop-off locations, select your preferred ride type, and confirm your booking. Once confirmed, your assigned driver’s details appear instantly, and you can track your driver in real-time until pickup',
    },
    {
      question: 'Can I add a guard or escort to my ride?',
      answer: ' Yes, you can request a security guard or escort for additional protection. Select “Add Security Escort” during booking, review the cost, and confirm. This service is ideal for VIP movements, late-night trips, or sensitive transfers. Availability may vary by location',
    },
    {
      question: 'How do I track my ride?',
      answer: ' Once your ride has been booked, you can monitor your driver’s movement live on the app. You’ll receive notifications for “Driver En Route,” “Driver Arrived,” and “Trip Started” so you’re informed from start to finish',
    },
    {
      question: 'Is the price fixed or does it change?',
      answer: ' Fares are calculated based on distance, route, and time. Once confirmed, your fare is locked in and won’t change unless you modify your route or delay the trip. Escardia ensures full price transparency',
    },
    {
      question: 'How do I pay for my ride?',
      answer: ' Escardia supports multiple payment options: card, Escardia wallet, transfer, or cash (where available). Choose your preferred payment before confirming the trip. Digital receipts are available in your trip history.',
    },
    {
      question: 'Can I schedule a ride in advance?',
      answer: ' Yes, you can plan your ride ahead of time. Tap “Schedule Ride,” choose your pick-up time, and confirm. A driver will be assigned before your scheduled time for reliability and punctuality',
    },
    {
      question: 'How do I contact my driver?',
      answer: ' After booking, your driver’s name, contact number, and vehicle details appear in the app. You can call or message them directly through the app without sharing your personal number',
    },
    {
      question: 'What if I need to cancel my ride?',
      answer: ' You can cancel anytime before pickup. Go to the active ride screen, tap “Cancel Ride,” and select a reason. A small fee may apply if the driver is already on the way. Refunds for prepaid trips are processed automatically',
    },
    {
      question: ' What is Escardia Self-Drive?',
      answer: 'Escardia Self-Drive allows you to rent and drive vehicles yourself. You can browse, reserve, and pay directly in the app. Each vehicle is verified, insured, and regularly inspected for safety',
    },
    {
      question: ' How does insurance work on self-drive rentals?',
      answer: 'All self-drive vehicles come with standard insurance, including third-party liability and basic damage protection. Vendors may also offer extended coverage options. Insurance type and coverage limits are visible before booking',
    },
    {
      question: 'What happens if there’s damage to the vehicle?',
      answer: ' If damage occurs, report it immediately through the Help Desk. Submit photos and a description. The report is reviewed and assigned a severity level: • Level 1 – Minor: scratches or small dents • Level 2 – Moderate: bumper or mirror damage • Level 3 – Severe: major bodywork or engine damage. Costs are handled based on severity and coverage.',
    },
    {
      question: 'How are damage costs calculated?',
      answer: ' Costs depend on repair estimates, severity, and insurance coverage. Escardia provides a transparent damage assessment report before any deductions are made.',
    },
    {
      question: 'Who can I contact for help or emergencies?',
      answer: 'You can reach Escardia’s Help Desk 24/7 in the app under Support → Help Desk. Our team responds quickly and can connect you with emergency services or roadside assistance if needed',
    },
  ];

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };
 
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FAQ</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {faqs.map((faq, index) => (
          <View key={index} style={styles.faqItem}>
            <TouchableOpacity
              style={styles.questionContainer}
              onPress={() => toggleExpand(index)}
            >
              <Text style={styles.questionText}>{faq.question}</Text>
              <Text style={styles.expandIcon}>
                {expandedIndex === index ? '−' : '+'}
              </Text>
            </TouchableOpacity>
            
            {expandedIndex === index && (
              <View style={styles.answerContainer}>
                <Text style={styles.answerText}>{faq.answer}</Text>
              </View>
            )}
          </View>
        ))}
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
  content: {
    flex: 1,
    padding: 20,
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  questionText: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    marginRight: 12,
  },
  expandIcon: {
    fontSize: 24,
    color: '#0066FF',
    fontWeight: 'bold',
  },
  answerContainer: {
    padding: 18,
    paddingTop: 0,
    backgroundColor: '#F8F9FA',
  },
  answerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
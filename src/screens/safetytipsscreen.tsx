import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface SafetyTipsScreenProps {
  onNavigateBack: () => void;
}

export const SafetyTipsScreen: React.FC<SafetyTipsScreenProps> = ({ onNavigateBack }) => {
  const safetyTips = [
    'Always keep your app updated to the latest version.',
    'Never share your password or one-time codes with anyone.',
    "Confirm the driver's name, photo, and plate number before entering a ride.",
    'Use biometric login for faster and safer access.',
    'Report any suspicious activity through the in-app help center.',
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety Tips</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {safetyTips.map((tip, index) => (
          <View key={index} style={styles.tipItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8EAF6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#E8EAF6',
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
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  bullet: {
    fontSize: 20,
    color: '#000',
    marginRight: 12,
    marginTop: -2,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    lineHeight: 22,
  },
});
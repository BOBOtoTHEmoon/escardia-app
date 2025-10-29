// ============================================
// File: src/screens/supportscreen.tsx

import React from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface SupportScreenProps {
  onNavigateBack: () => void;
  onNavigateToFAQ: () => void;
  onNavigateToPolicies: () => void;
  onNavigateToContactUs: () => void;
}

export const SupportScreen: React.FC<SupportScreenProps> = ({
  onNavigateBack,
  onNavigateToFAQ,
  onNavigateToPolicies,
  onNavigateToContactUs,
}) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
  {/* Menu Items */}
  <TouchableOpacity style={styles.menuItem} onPress={onNavigateToFAQ}>
    <View style={styles.iconContainer}>
      <Image
        source={require('../../assets/images/faq.png')}
        style={styles.menuIconImage}
        resizeMode="contain"
      />
    </View>
    <Text style={styles.menuText}>Frequently Asked Questions</Text>
    <Text style={styles.arrow}>›</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.menuItem} onPress={onNavigateToPolicies}>
    <View style={styles.iconContainer}>
      <Image
        source={require('../../assets/images/policies.png')}
        style={styles.menuIconImage}
        resizeMode="contain"
      />
    </View>
    <Text style={styles.menuText}>Our Policies</Text>
    <Text style={styles.arrow}>›</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.menuItem}>
    <View style={styles.iconContainer}>
      <Image
        source={require('../../assets/images/insurance.png')}
        style={styles.menuIconImage}
        resizeMode="contain"
      />
    </View>
    <Text style={styles.menuText}>Insurance</Text>
    <Text style={styles.arrow}>›</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.menuItem} onPress={onNavigateToContactUs}>
    <View style={styles.iconContainer}>
      <Image
        source={require('../../assets/images/contact.png')}
        style={styles.menuIconImage}
        resizeMode="contain"
      />
    </View>
    <Text style={styles.menuText}>Contact us</Text>
    <Text style={styles.arrow}>›</Text>
  </TouchableOpacity>
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  arrow: {
    fontSize: 24,
    color: '#999',
  },
  menuIconImage: {
  width: 20,
  height: 20,
},
});

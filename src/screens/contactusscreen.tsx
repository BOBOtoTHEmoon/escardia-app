import React from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet, ScrollView, Linking } from 'react-native';

interface ContactUsScreenProps {
  onNavigateBack: () => void;
  onNavigateToChatWithUs: () => void;
}

export const ContactUsScreen: React.FC<ContactUsScreenProps> = ({ onNavigateBack, onNavigateToChatWithUs, }) => {
  const handleCall = () => {
    Linking.openURL('tel:+2349116511460'); // Replace with actual number
  };

  const handleEmail = () => {
    Linking.openURL('mailto:contact@escardia.com');
  };

  const handleInstagram = () => {
    Linking.openURL('https://instagram.com/escardia.co');
  };

  const handleTwitter = () => {
    Linking.openURL('https://twitter.com/escardiaCo');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Us</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
  <TouchableOpacity style={styles.contactItem} onPress={handleCall}>
    <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
      <Image
        source={require('../../assets/images/call.png')}
        style={styles.contactIcon}
        resizeMode="contain"
      />
    </View>
    <Text style={styles.contactText}>Call us</Text>
    <Text style={styles.arrow}>›</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.contactItem} onPress={onNavigateToChatWithUs}>
    <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
      <Image
        source={require('../../assets/images/chat.png')}
        style={styles.contactIcon}
        resizeMode="contain"
      />
    </View>
    <Text style={styles.contactText}>Chat with us</Text>
    <Text style={styles.arrow}>›</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.contactItem} onPress={handleEmail}>
    <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
      <Image
        source={require('../../assets/images/email.png')}
        style={styles.contactIcon}
        resizeMode="contain"
      />
    </View>
    <Text style={styles.contactText}>Email us</Text>
    <Text style={styles.arrow}>›</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.contactItem} onPress={handleInstagram}>
    <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
      <Image
        source={require('../../assets/images/instagram.png')}
        style={styles.contactIcon}
        resizeMode="contain"
      />
    </View>
    <Text style={styles.contactText}>Instagram</Text>
    <Text style={styles.arrow}>›</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.contactItem} onPress={handleTwitter}>
    <View style={[styles.iconContainer, { backgroundColor: '#E1F5FE' }]}>
      <Image
        source={require('../../assets/images/twitter.png')}
        style={styles.contactIcon}
        resizeMode="contain"
      />
    </View>
    <Text style={styles.contactText}>X</Text>
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
  contactItem: {
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  contactText: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  arrow: {
    fontSize: 24,
    color: '#999',
  },
  contactIcon: {
  width: 20,
  height: 20,
},
});
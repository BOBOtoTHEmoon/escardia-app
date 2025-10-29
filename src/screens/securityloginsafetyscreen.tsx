import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';

interface SecurityLoginSafetyScreenProps {
  onNavigateBack: () => void;
  onNavigateToChangePassword: () => void;
  onNavigateToSafetyTips: () => void;
}

export const SecurityLoginSafetyScreen: React.FC<SecurityLoginSafetyScreenProps> = ({
  onNavigateBack,
  onNavigateToChangePassword,
  onNavigateToSafetyTips,
}) => {
  const [twoStepVerification, setTwoStepVerification] = useState(true);
  const [saveLoginInfo, setSaveLoginInfo] = useState(true);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security, Login and Safety</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Security Section */}
        <Text style={styles.sectionLabel}>Security</Text>

        <TouchableOpacity style={styles.menuItem} onPress={onNavigateToChangePassword}>
          <Text style={styles.menuText}>Password</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>Biometrics/Face ID login</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.menuItem}>
          <Text style={styles.menuText}>Two-Step Verification</Text>
          <Switch
            value={twoStepVerification}
            onValueChange={setTwoStepVerification}
            trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Login Section */}
        <Text style={[styles.sectionLabel, styles.sectionSpacing]}>Login</Text>

        <View style={styles.menuItem}>
          <Text style={styles.menuText}>Save Login Info</Text>
          <Switch
            value={saveLoginInfo}
            onValueChange={setSaveLoginInfo}
            trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.menuItem}>
          <Text style={styles.menuText}>Gmail</Text>
          <TouchableOpacity>
            <Text style={styles.linkText}>Unlink</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuItem}>
          <Text style={styles.menuText}>Apple ID</Text>
          <TouchableOpacity>
            <Text style={styles.linkText}>link</Text>
          </TouchableOpacity>
        </View>

      
        {/* Safety Section */}
        <Text style={[styles.sectionLabel, styles.sectionSpacing]}>Safety</Text>

        <TouchableOpacity style={styles.menuItem} onPress={onNavigateToSafetyTips}>
          <Text style={styles.menuText}>Safety tips</Text>
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
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  sectionSpacing: {
    marginTop: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuText: {
    fontSize: 15,
    color: '#000',
  },
  arrow: {
    fontSize: 24,
    color: '#9CA3AF',
  },
  linkText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
});

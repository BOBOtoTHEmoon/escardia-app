import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView, Image } from 'react-native';

interface LocationSelectorProps {
  visible: boolean;
  currentLocation: string;
  onClose: () => void;
  onSelectLocation: (location: string) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  visible,
  currentLocation,
  onClose,
  onSelectLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Popular locations in Lagos (you can customize this)
  const popularLocations = [
    'Victoria Island, Lagos',
    'Lekki Phase 1, Lagos',
    'Ikoyi, Lagos',
    'Surulere, Lagos',
    'Ikeja, Lagos',
    'Yaba, Lagos',
    'Ajah, Lagos',
    'Maryland, Lagos',
    'Festac, Lagos',
  ];

  // Filter locations based on search
  const filteredLocations = popularLocations.filter(location =>
    location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectLocation = (location: string) => {
    onSelectLocation(location);
    setSearchQuery('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Location</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Image
              source={require('../../assets/images/search.png')}
              style={styles.searchIcon}
              resizeMode="contain"
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for location..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Current Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Location</Text>
            <TouchableOpacity
              style={styles.locationItem}
              onPress={() => handleSelectLocation(currentLocation)}
            >
              <View style={styles.locationIconContainer}>
                <Image
                  source={require('../../assets/images/location.png')}
                  style={styles.locationIcon}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.locationText}>{currentLocation}</Text>
              <Text style={styles.checkIcon}>✓</Text>
            </TouchableOpacity>
          </View>

          {/* Popular Locations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Locations</Text>
            <ScrollView style={styles.locationsList} showsVerticalScrollIndicator={false}>
              {filteredLocations.map((location, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.locationItem}
                  onPress={() => handleSelectLocation(location)}
                >
                  <View style={styles.locationIconContainer}>
                    <Image
                      source={require('../../assets/images/location.png')}
                      style={styles.locationIcon}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.locationText}>{location}</Text>
                  {location === currentLocation && (
                    <Text style={styles.checkIcon}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
              
              {filteredLocations.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No locations found</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  closeIcon: {
    fontSize: 24,
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    margin: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  locationsList: {
    maxHeight: 300,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
  },
  locationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationIcon: {
    width: 18,
    height: 18,
  },
  locationText: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  checkIcon: {
    fontSize: 20,
    color: '#10B981',
    fontWeight: 'bold',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
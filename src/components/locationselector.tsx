import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import * as Location from 'expo-location';

interface LocationSelectorProps {
  visible: boolean;
  currentLocation: string;
  onClose: () => void;
  onSelectLocation: (location: string, coordinates?: { latitude: number; longitude: number }) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  visible,
  currentLocation,
  onClose,
  onSelectLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationPermission, setLocationPermission] = useState<string | null>(null);

  // Popular locations in Nigeria (fallback)
  const popularLocations = [
    { name: 'Victoria Island, Lagos', coords: { latitude: 6.4281, longitude: 3.4219 } },
    { name: 'Lekki Phase 1, Lagos', coords: { latitude: 6.4698, longitude: 3.5852 } },
    { name: 'Ikoyi, Lagos', coords: { latitude: 6.4549, longitude: 3.4366 } },
    { name: 'Surulere, Lagos', coords: { latitude: 6.5059, longitude: 3.3509 } },
    { name: 'Ikeja, Lagos', coords: { latitude: 6.6018, longitude: 3.3515 } },
    { name: 'Yaba, Lagos', coords: { latitude: 6.5095, longitude: 3.3711 } },
    { name: 'Ajah, Lagos', coords: { latitude: 6.4667, longitude: 3.5833 } },
    { name: 'Maryland, Lagos', coords: { latitude: 6.5714, longitude: 3.3643 } },
    { name: 'Festac, Lagos', coords: { latitude: 6.4698, longitude: 3.2833 } },
    { name: 'Abuja, FCT', coords: { latitude: 9.0579, longitude: 7.4951 } },
    { name: 'Port Harcourt, Rivers', coords: { latitude: 4.8156, longitude: 7.0498 } },
    { name: 'Ibadan, Oyo', coords: { latitude: 7.3775, longitude: 3.9470 } },
  ];

  // Check permission on mount
  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setLocationPermission(status);
  };

  // Get current location using GPS
  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);

    try {
      // Request permission if not granted
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Please enable location access in your device settings to use this feature.',
          [{ text: 'OK' }]
        );
        setIsLoadingLocation(false);
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // Reverse geocode to get address
      const [address] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (address) {
        // Format the address nicely
        const formattedAddress = formatAddress(address);
        
        onSelectLocation(formattedAddress, { latitude, longitude });
        setSearchQuery('');
        onClose();
      } else {
        // Fallback if no address found
        onSelectLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, { latitude, longitude });
        onClose();
      }
    } catch (error: any) {
      console.error('Location error:', error);
      Alert.alert(
        'Location Error',
        'Could not get your location. Please try again or select manually.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Format address from geocode result
  const formatAddress = (address: Location.LocationGeocodedAddress): string => {
    const parts = [];

    if (address.name && !address.name.includes('+')) {
      parts.push(address.name);
    }
    if (address.street) {
      parts.push(address.street);
    }
    if (address.district) {
      parts.push(address.district);
    } else if (address.subregion) {
      parts.push(address.subregion);
    }
    if (address.city) {
      parts.push(address.city);
    } else if (address.region) {
      parts.push(address.region);
    }

    // If we got nothing useful, try a different combination
    if (parts.length === 0) {
      if (address.formattedAddress) {
        return address.formattedAddress;
      }
      return `${address.region || ''}, ${address.country || 'Nigeria'}`.trim();
    }

    return parts.slice(0, 3).join(', '); // Limit to 3 parts
  };

  // Filter locations based on search
  const filteredLocations = popularLocations.filter(location =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle selecting a location from list
  const handleSelectLocation = (location: { name: string; coords: { latitude: number; longitude: number } }) => {
    onSelectLocation(location.name, location.coords);
    setSearchQuery('');
    onClose();
  };

  // Handle manual entry (when user types custom location)
  const handleManualEntry = () => {
    if (searchQuery.trim().length > 2) {
      onSelectLocation(searchQuery.trim());
      setSearchQuery('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Location</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a location..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              onSubmitEditing={handleManualEntry}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Use Current Location Button */}
          <TouchableOpacity
            style={styles.currentLocationButton}
            onPress={getCurrentLocation}
            disabled={isLoadingLocation}
          >
            <View style={styles.currentLocationIcon}>
              {isLoadingLocation ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <Text style={styles.locationPinIcon}>📍</Text>
              )}
            </View>
            <View style={styles.currentLocationText}>
              <Text style={styles.currentLocationTitle}>
                {isLoadingLocation ? 'Getting your location...' : 'Use my current location'}
              </Text>
              <Text style={styles.currentLocationSubtitle}>
                {isLoadingLocation ? 'Please wait' : 'Using GPS'}
              </Text>
            </View>
            <Text style={styles.arrowIcon}>→</Text>
          </TouchableOpacity>

          {/* Current Selected Location */}
          {currentLocation && currentLocation !== 'Select Location' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Currently Selected</Text>
              <TouchableOpacity
                style={styles.selectedLocationItem}
                onPress={() => {
                  onSelectLocation(currentLocation);
                  onClose();
                }}
              >
                <Text style={styles.selectedLocationIcon}>✓</Text>
                <Text style={styles.selectedLocationText}>{currentLocation}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Search Results / Popular Locations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {searchQuery ? 'Search Results' : 'Popular Locations'}
            </Text>
            <ScrollView 
              style={styles.locationsList} 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Manual entry option when searching */}
              {searchQuery.trim().length > 2 && (
                <TouchableOpacity
                  style={styles.manualEntryItem}
                  onPress={handleManualEntry}
                >
                  <Text style={styles.manualEntryIcon}>➕</Text>
                  <Text style={styles.manualEntryText}>Use "{searchQuery}"</Text>
                </TouchableOpacity>
              )}

              {filteredLocations.map((location, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.locationItem}
                  onPress={() => handleSelectLocation(location)}
                >
                  <View style={styles.locationIconContainer}>
                    <Text style={styles.locationIcon}>📍</Text>
                  </View>
                  <Text style={styles.locationText}>{location.name}</Text>
                  {location.name === currentLocation && (
                    <Text style={styles.checkIcon}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}

              {filteredLocations.length === 0 && searchQuery.trim().length <= 2 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No locations found</Text>
                  <Text style={styles.emptySubtext}>Type at least 3 characters to search</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
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
    fontWeight: '700',
    color: '#000',
  },
  closeButton: {
    padding: 4,
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
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  clearIcon: {
    fontSize: 18,
    color: '#999',
    padding: 4,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  currentLocationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  locationPinIcon: {
    fontSize: 22,
  },
  currentLocationText: {
    flex: 1,
  },
  currentLocationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 2,
  },
  currentLocationSubtitle: {
    fontSize: 13,
    color: '#3B82F6',
  },
  arrowIcon: {
    fontSize: 20,
    color: '#3B82F6',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedLocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedLocationIcon: {
    fontSize: 18,
    color: '#059669',
    marginRight: 12,
    fontWeight: 'bold',
  },
  selectedLocationText: {
    flex: 1,
    fontSize: 15,
    color: '#065F46',
    fontWeight: '500',
  },
  locationsList: {
    maxHeight: 280,
  },
  manualEntryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  manualEntryIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  manualEntryText: {
    flex: 1,
    fontSize: 15,
    color: '#92400E',
    fontWeight: '500',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  locationIcon: {
    fontSize: 18,
  },
  locationText: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
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
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});

export default LocationSelector;
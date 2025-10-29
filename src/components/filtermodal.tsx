import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
}

export interface FilterOptions {
  brand: string;
  carType: string;
  transmission: string;
  seats: string;
  minPrice: number;
  maxPrice: number;
}

export const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose, onApply }) => {
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedCarType, setSelectedCarType] = useState('All');
  const [selectedTransmission, setSelectedTransmission] = useState('All');
  const [selectedSeats, setSelectedSeats] = useState('All');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000000);

  const brands = ['All', 'Toyota', 'Mercedes', 'Lexus', 'BMW', 'Honda', 'Range Rover'];
  const carTypes = ['All', 'SUV', 'Sedan', 'Coupe', 'Hatchback', 'Truck'];
  const transmissions = ['All', 'Automatic', 'Manual'];
  const seatOptions = ['All', '2', '4', '5', '6+'];

  const handleReset = () => {
    setSelectedBrand('All');
    setSelectedCarType('All');
    setSelectedTransmission('All');
    setSelectedSeats('All');
    setMinPrice(0);
    setMaxPrice(5000000);
  };

  const handleApply = () => {
    onApply({
      brand: selectedBrand,
      carType: selectedCarType,
      transmission: selectedTransmission,
      seats: selectedSeats,
      minPrice,
      maxPrice,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={filterStyles.overlay}>
        <TouchableOpacity style={filterStyles.backdrop} onPress={onClose} activeOpacity={1} />
        
        <View style={filterStyles.modalContainer}>
          {/* Header */}
          <View style={filterStyles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={filterStyles.closeIcon}>✕</Text>
            </TouchableOpacity>
            <Text style={filterStyles.headerTitle}>Filter Cars</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={filterStyles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={filterStyles.content} showsVerticalScrollIndicator={false}>
          {/* Price Range Section */}
<View style={filterStyles.section}>
  <Text style={filterStyles.sectionTitle}>Price Range (per day)</Text>
  
  <View style={filterStyles.priceInputsRow}>
    <View style={filterStyles.priceInputContainer}>
      <Text style={filterStyles.priceInputLabel}>Min</Text>
      <Text style={filterStyles.priceInputValue}>
        ₦{minPrice.toLocaleString()}
      </Text>
    </View>
    
    <Text style={filterStyles.priceSeparator}>—</Text>
    
    <View style={filterStyles.priceInputContainer}>
      <Text style={filterStyles.priceInputLabel}>Max</Text>
      <Text style={filterStyles.priceInputValue}>
        ₦{maxPrice.toLocaleString()}
      </Text>
    </View>
  </View>

  {/* Quick Price Buttons */}
  <View style={filterStyles.priceButtons}>
    <TouchableOpacity 
      style={filterStyles.priceQuickButton}
      onPress={() => { setMinPrice(0); setMaxPrice(100000); }}
    >
      <Text style={filterStyles.priceQuickText}>Under 100k</Text>
    </TouchableOpacity>
    
    <TouchableOpacity 
      style={filterStyles.priceQuickButton}
      onPress={() => { setMinPrice(100000); setMaxPrice(500000); }}
    >
      <Text style={filterStyles.priceQuickText}>100k - 500k</Text>
    </TouchableOpacity>
    
    <TouchableOpacity 
      style={filterStyles.priceQuickButton}
      onPress={() => { setMinPrice(500000); setMaxPrice(1000000); }}
    >
      <Text style={filterStyles.priceQuickText}>500k - 1M</Text>
    </TouchableOpacity>
    
    <TouchableOpacity 
      style={filterStyles.priceQuickButton}
      onPress={() => { setMinPrice(1000000); setMaxPrice(5000000); }}
    >
      <Text style={filterStyles.priceQuickText}>1M+</Text>
    </TouchableOpacity>
  </View>
</View>

            {/* Brand Section */}
            <View style={filterStyles.section}>
              <Text style={filterStyles.sectionTitle}>Brand</Text>
              <View style={filterStyles.chipsContainer}>
                {brands.map((brand, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      filterStyles.chip,
                      selectedBrand === brand && filterStyles.chipSelected,
                    ]}
                    onPress={() => setSelectedBrand(brand)}
                  >
                    <Text
                      style={[
                        filterStyles.chipText,
                        selectedBrand === brand && filterStyles.chipTextSelected,
                      ]}
                    >
                      {brand}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Car Type Section */}
            <View style={filterStyles.section}>
              <Text style={filterStyles.sectionTitle}>Car Type</Text>
              <View style={filterStyles.chipsContainer}>
                {carTypes.map((type, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      filterStyles.chip,
                      selectedCarType === type && filterStyles.chipSelected,
                    ]}
                    onPress={() => setSelectedCarType(type)}
                  >
                    <Text
                      style={[
                        filterStyles.chipText,
                        selectedCarType === type && filterStyles.chipTextSelected,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Transmission Section */}
            <View style={filterStyles.section}>
              <Text style={filterStyles.sectionTitle}>Transmission</Text>
              <View style={filterStyles.chipsContainer}>
                {transmissions.map((trans, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      filterStyles.chip,
                      selectedTransmission === trans && filterStyles.chipSelected,
                    ]}
                    onPress={() => setSelectedTransmission(trans)}
                  >
                    <Text
                      style={[
                        filterStyles.chipText,
                        selectedTransmission === trans && filterStyles.chipTextSelected,
                      ]}
                    >
                      {trans}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Seats Section */}
            <View style={filterStyles.section}>
              <Text style={filterStyles.sectionTitle}>Seats</Text>
              <View style={filterStyles.chipsContainer}>
                {seatOptions.map((seat, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      filterStyles.chip,
                      selectedSeats === seat && filterStyles.chipSelected,
                    ]}
                    onPress={() => setSelectedSeats(seat)}
                  >
                    <Text
                      style={[
                        filterStyles.chipText,
                        selectedSeats === seat && filterStyles.chipTextSelected,
                      ]}
                    >
                      {seat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={filterStyles.bottomSpacing} />
          </ScrollView>

          {/* Apply Button */}
          <View style={filterStyles.footer}>
            <TouchableOpacity style={filterStyles.applyButton} onPress={handleApply}>
              <Text style={filterStyles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const filterStyles = StyleSheet.create({
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeIcon: {
    fontSize: 24,
    color: '#6B7280',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  resetText: {
    fontSize: 14,
    color: '#2F5FED',
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  priceDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2F5FED',
  },
  sliderLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 4,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipSelected: {
    backgroundColor: '#2F5FED',
    borderColor: '#2F5FED',
  },
  chipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  applyButton: {
    backgroundColor: '#2F5FED',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  priceInputsRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 16,
},
priceInputContainer: {
  flex: 1,
  backgroundColor: '#F3F4F6',
  padding: 16,
  borderRadius: 12,
  alignItems: 'center',
},
priceInputLabel: {
  fontSize: 12,
  color: '#6B7280',
  marginBottom: 4,
},
priceInputValue: {
  fontSize: 16,
  fontWeight: '600',
  color: '#2F5FED',
},
priceSeparator: {
  fontSize: 20,
  color: '#6B7280',
  marginHorizontal: 12,
},
priceButtons: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
},
priceQuickButton: {
  flex: 1,
  minWidth: '45%',
  backgroundColor: '#F3F4F6',
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderRadius: 12,
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#E5E7EB',
},
priceQuickText: {
  fontSize: 13,
  color: '#374151',
  fontWeight: '500',
},
});
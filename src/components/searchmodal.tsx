import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  ScrollView, 
  Image, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  onNavigateToCarDetails: (carId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ 
  visible, 
  onClose, 
  onSearch,
  onNavigateToCarDetails 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (visible) {
      loadRecentSearches();
      setSearchQuery('');
      setSearchResults([]);
      setHasSearched(false);
    }
  }, [visible]);

  const loadRecentSearches = async () => {
    try {
      const searches = await AsyncStorage.getItem('recentSearches');
      if (searches) {
        setRecentSearches(JSON.parse(searches));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const saveRecentSearch = async (query: string) => {
    try {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) return;

      let searches = [...recentSearches];
      searches = searches.filter(s => s.toLowerCase() !== trimmedQuery.toLowerCase());
      searches.unshift(trimmedQuery);
      searches = searches.slice(0, 10);
      
      setRecentSearches(searches);
      await AsyncStorage.setItem('recentSearches', JSON.stringify(searches));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  const clearRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem('recentSearches');
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  };

  const handleSearch = async (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setLoading(true);
    setHasSearched(true);

    try {
      console.log('🔍 Searching for:', trimmedQuery);
      
      // ✅ USE CARSERVICE (has vendor filtering!)
      const { getAllCars } = await import('../services/carservice');
      const carResult = await getAllCars();

      if (!carResult.success || !carResult.cars) {
        console.error('❌ Failed to get cars');
        setSearchResults([]);
        return;
      }

      const allCars = carResult.cars;

      // ✅ Filter by search query
      const searchLower = trimmedQuery.toLowerCase();
      const results = allCars.filter((car: any) => {
        const brand = (car.brand || '').toLowerCase();
        const model = (car.model || '').toLowerCase();
        const type = (car.type || '').toLowerCase();
        const year = (car.year || '').toString();
        const location = (car.location || '').toLowerCase();

        return brand.includes(searchLower) ||
               model.includes(searchLower) ||
               type.includes(searchLower) ||
               year.includes(searchLower) ||
               location.includes(searchLower) ||
               `${brand} ${model}`.includes(searchLower);
      });

      console.log(`✅ Found ${results.length} results from approved vendors`);
      setSearchResults(results);
      await saveRecentSearch(trimmedQuery);
      onSearch(trimmedQuery);
    } catch (error) {
      console.error('❌ Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCarPress = (carId: string) => {
    onNavigateToCarDetails(carId);
    onClose();
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
          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Image
              source={require('../../assets/images/search.png')}
              style={styles.searchIcon}
              resizeMode="contain"
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by brand, model, location..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => handleSearch(searchQuery)}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Loading */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2F5FED" />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            )}

            {/* Search Results */}
            {!loading && hasSearched && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
                </Text>

                {searchResults.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>🚗</Text>
                    <Text style={styles.emptyText}>No cars found</Text>
                  </View>
                ) : (
                  searchResults.map((car) => (
                    <TouchableOpacity
                      key={car.id}
                      style={styles.resultCard}
                      onPress={() => handleCarPress(car.id)}
                    >
                      <View style={styles.resultImageContainer}>
                        {car.photos && car.photos.length > 0 ? (
                          <Image 
                            source={{ uri: car.photos[0] }} 
                            style={styles.resultImage} 
                            resizeMode="cover"
                          />
                        ) : (
                          <Text style={styles.resultImagePlaceholder}>🚗</Text>
                        )}
                      </View>
                      <View style={styles.resultInfo}>
                        <Text style={styles.resultBrand}>{car.brand}</Text>
                        <Text style={styles.resultModel}>{car.model}</Text>
                        <Text style={styles.resultLocation}>📍 {car.location}</Text>
                        <Text style={styles.resultPrice}>
                          ₦{car.pricePerDay?.toLocaleString()}/day
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            {/* Recent Searches */}
            {!loading && !hasSearched && recentSearches.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Searches</Text>
                  <TouchableOpacity onPress={clearRecentSearches}>
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
                </View>

                {recentSearches.slice(0, 4).map((item, index) => (
                  <TouchableOpacity
                    key={`recent-${index}`}
                    style={styles.searchItem}
                    onPress={() => {
                      setSearchQuery(item);
                      handleSearch(item);
                    }}
                  >
                    <Image
                      source={require('../../assets/images/dot.png')}
                      style={styles.itemIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.searchItemText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Popular Searches */}
            {!loading && !hasSearched && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Popular Searches</Text>
                  <Image
                    source={require('../../assets/images/trending.png')}
                    style={styles.trendingIcon}
                    resizeMode="contain"
                  />
                </View>

                {['Toyota', 'Mercedes', 'Lexus', 'BMW'].map((item, index) => (
                  <TouchableOpacity
                    key={`popular-${index}`}
                    style={styles.searchItem}
                    onPress={() => {
                      setSearchQuery(item);
                      handleSearch(item);
                    }}
                  >
                    <Image
                      source={require('../../assets/images/dot.png')}
                      style={styles.itemIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.searchItemText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
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
    backgroundColor: '#E8EAF6',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
  closeIcon: {
    fontSize: 20,
    color: '#666',
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A237E',
  },
  clearText: {
    fontSize: 14,
    color: '#2F5FED',
    fontWeight: '600',
  },
  trendingIcon: {
    width: 20,
    height: 20,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  itemIcon: {
    width: 16,
    height: 16,
    marginRight: 12,
  },
  searchItemText: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 50,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  resultImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  resultImage: {
    width: '100%',
    height: '100%',
  },
  resultImagePlaceholder: {
    fontSize: 30,
  },
  resultInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  resultBrand: {
    fontSize: 12,
    color: '#666',
  },
  resultModel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  resultLocation: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  resultPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2F5FED',
  },
});

export default SearchModal;
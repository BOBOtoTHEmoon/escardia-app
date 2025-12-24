import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../constants';

interface SearchableDropdownProps {
  label: string;
  placeholder: string;
  value: string;
  onSelect: (value: string) => void;
  options: string[];
  error?: string;
  allowCustom?: boolean;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  label,
  placeholder,
  value,
  onSelect,
  options,
  error,
  allowCustom = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState(value);
  const [filteredOptions, setFilteredOptions] = useState<string[]>(options);
  const inputRef = useRef<TextInput>(null);

  // Update search text when value changes externally
  useEffect(() => {
    setSearchText(value);
  }, [value]);

  // Filter options based on search text
  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(option =>
        option.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [searchText, options]);

  const handleOpen = () => {
    setIsOpen(true);
    setSearchText(value);
    setFilteredOptions(options);
  };

  const handleSelect = (selectedValue: string) => {
    onSelect(selectedValue);
    setSearchText(selectedValue);
    setIsOpen(false);
    Keyboard.dismiss();
  };

  const handleCustomSubmit = () => {
    if (searchText.trim()) {
      onSelect(searchText.trim());
      setIsOpen(false);
      Keyboard.dismiss();
    }
  };

  const isCustomValue = searchText.trim() !== '' && 
    !options.some(opt => opt.toLowerCase() === searchText.toLowerCase());

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      {/* Display Button */}
      <TouchableOpacity
        style={[styles.inputButton, error && styles.inputError]}
        onPress={handleOpen}
      >
        <Text style={[styles.inputText, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
        <Text style={styles.dropdownIcon}>▼</Text>
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}

<Modal
  visible={isOpen}
  transparent={true}
  animationType="slide"
  onRequestClose={() => setIsOpen(false)}
>
  <KeyboardAvoidingView 
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    style={styles.modalOverlay}
  >
    <TouchableOpacity 
      style={styles.modalBackdrop}
      activeOpacity={1}
      onPress={() => setIsOpen(false)}
    />
    <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {label}</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                ref={inputRef}
                style={styles.searchInput}
                placeholder={`Search or type ${label.toLowerCase()}...`}
                placeholderTextColor={colors.textSecondary}
                value={searchText}
                onChangeText={setSearchText}
                autoFocus={false}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleCustomSubmit}
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')}>
                  <Text style={styles.clearButton}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Custom Value Option */}
            {allowCustom && isCustomValue && searchText.trim().length > 0 && (
              <TouchableOpacity
                style={styles.customOption}
                onPress={handleCustomSubmit}
              >
                <Text style={styles.customOptionIcon}>➕</Text>
                <Text style={styles.customOptionText}>
                  Add "{searchText.trim()}"
                </Text>
              </TouchableOpacity>
            )}

            {/* Options List */}
            <ScrollView 
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionItem,
                      option === value && styles.optionItemActive
                    ]}
                    onPress={() => handleSelect(option)}
                  >
                    <Text style={[
                      styles.optionText,
                      option === value && styles.optionTextActive
                    ]}>
                      {option}
                    </Text>
                    {option === value && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsText}>
                    No matches found
                  </Text>
                  {allowCustom && searchText.trim().length > 0 && (
                    <Text style={styles.noResultsHint}>
                      Press "Add" above to use "{searchText.trim()}"
                    </Text>
                  )}
                </View>
              )}
   </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  inputButton: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    flex: 1,
  },
  placeholderText: {
    color: colors.textSecondary,
  },
  dropdownIcon: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: '#EF4444',
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    fontSize: 24,
    color: colors.textSecondary,
    padding: spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    margin: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text,
    paddingVertical: spacing.xs,
  },
  clearButton: {
    fontSize: 18,
    color: colors.textSecondary,
    padding: spacing.xs,
  },
  customOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  customOptionIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  customOptionText: {
    fontSize: typography.fontSize.base,
    color: '#92400E',
    fontWeight: '600',
  },
  optionsList: {
    paddingHorizontal: spacing.lg,
    maxHeight: 350,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  optionItemActive: {
    backgroundColor: colors.primary + '20',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: 'bold',
  },
  noResults: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  noResultsHint: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalBackdrop: {
  flex: 1,
},
});

export default SearchableDropdown;
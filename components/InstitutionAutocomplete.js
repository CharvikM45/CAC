import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Colors } from '../constants/colors';
import { institutions } from '../data/institutions';

const InstitutionAutocomplete = ({ value, onChangeText, placeholder, style }) => {
  const [filteredInstitutions, setFilteredInstitutions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (value.length > 0) {
      const filtered = institutions.filter(institution =>
        institution.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 10); // Limit to 10 results
      setFilteredInstitutions(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setFilteredInstitutions([]);
      setShowDropdown(false);
    }
  }, [value]);

  const handleSelectInstitution = (institution) => {
    onChangeText(institution);
    setShowDropdown(false);
  };

  const handleFocus = () => {
    if (value.length > 0 && filteredInstitutions.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleBlur = () => {
    // Delay hiding dropdown to allow for selection
    setTimeout(() => setShowDropdown(false), 150);
  };

  const renderInstitutionItem = (item) => (
    <TouchableOpacity
      key={item}
      style={styles.dropdownItem}
      onPress={() => handleSelectInstitution(item)}
    >
      <Text style={styles.dropdownItemText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, style]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textSecondary}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoCapitalize="words"
        autoCorrect={false}
      />
      
      {showDropdown && filteredInstitutions.length > 0 && (
        <View style={styles.dropdown}>
          <ScrollView
            style={styles.dropdownList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
            {filteredInstitutions.map(renderInstitutionItem)}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: Colors.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownList: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownItemText: {
    fontSize: 16,
    color: Colors.text,
  },
});

export default InstitutionAutocomplete;

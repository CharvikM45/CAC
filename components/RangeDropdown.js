import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { Colors } from '../constants/colors';

const RangeDropdown = ({ 
  label, 
  value, 
  onSelect, 
  placeholder = "Select range...",
  style,
  type = 'min' // 'min' or 'max'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Generate range options based on the type of property
  const generateRangeOptions = () => {
    const options = ['Any'];
    
    switch (type) {
      case 'tensile':
        return [...options, '0-20 MPa', '20-40 MPa', '40-60 MPa', '60-80 MPa', '80+ MPa'];
      case 'cost':
        return [...options, 'Under $2/kg', '$2-4/kg', '$4-6/kg', '$6-8/kg', '$8+/kg'];
      case 'density':
        return [...options, '0-0.5 g/cm³', '0.5-1.0 g/cm³', '1.0-1.5 g/cm³', '1.5+ g/cm³'];
      case 'biodegradability':
        return [...options, '0-20%', '20-40%', '40-60%', '60-80%', '80-100%'];
      case 'compressive':
        return [...options, '0-50 MPa', '50-100 MPa', '100-150 MPa', '150+ MPa'];
      case 'elastic':
        return [...options, '0-2 GPa', '2-5 GPa', '5-8 GPa', '8+ GPa'];
      case 'toughness':
        return [...options, '0-10 MJ/m³', '10-25 MJ/m³', '25-40 MJ/m³', '40+ MJ/m³'];
      case 'hardness':
        return [...options, '0-30 Shore D', '30-60 Shore D', '60-90 Shore D', '90+ Shore D'];
      case 'fatigue':
        return [...options, '0-10k cycles', '10k-50k cycles', '50k-100k cycles', '100k+ cycles'];
      case 'thermal':
        return [...options, '0-0.1 W/mK', '0.1-0.3 W/mK', '0.3+ W/mK'];
      case 'electrical':
        return [...options, '0-0.00001 S/m', '0.00001-0.0001 S/m', '0.0001+ S/m'];
      case 'rating':
        return [...options, '0-3/10', '3-5/10', '5-7/10', '7-10/10'];
      default:
        return options;
    }
  };

  const options = generateRangeOptions();

  const handleSelect = (option) => {
    onSelect(option === 'Any' ? '' : option);
    setIsOpen(false);
  };

  const renderOption = ({ item }) => (
    <TouchableOpacity
      style={styles.optionItem}
      onPress={() => handleSelect(item)}
    >
      <Text style={styles.optionText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setIsOpen(true)}
      >
        <Text style={[styles.dropdownText, { color: value ? Colors.text : Colors.textSecondary }]}>
          {value || placeholder}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={options}
              renderItem={renderOption}
              keyExtractor={(item) => item}
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginRight: 8,
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dropdownText: {
    flex: 1,
    fontSize: 14,
  },
  dropdownArrow: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    maxHeight: '80%',
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionText: {
    fontSize: 14,
    color: Colors.text,
  },
});

export default RangeDropdown;

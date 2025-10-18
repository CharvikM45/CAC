import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { Colors } from '../constants/colors';

const { width: screenWidth } = Dimensions.get('window');

const CompareModal = ({ visible, materials, onClose }) => {
  if (!materials || materials.length === 0) {
    console.log('CompareModal: No materials provided or empty array');
    return null;
  }
  
  console.log('CompareModal: Rendering with materials:', materials.length, materials.map(m => m['Material Name']));

  const formatValue = (value, unit = '') => {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return `${num.toFixed(2)}${unit}`;
  };

  const getPropertyColor = (value, type) => {
    const num = parseFloat(value);
    if (isNaN(num)) return Colors.textSecondary;
    
    switch (type) {
      case 'tensile':
        if (num > 70) return Colors.success;
        if (num > 40) return Colors.warning;
        return Colors.error;
      case 'cost':
        if (num < 3) return Colors.success;
        if (num < 7) return Colors.warning;
        return Colors.error;
      case 'biodegradability':
        if (num > 80) return Colors.success;
        if (num > 60) return Colors.warning;
        return Colors.error;
      case 'efficiency':
        if (num > 7) return Colors.success;
        if (num > 5) return Colors.warning;
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const properties = [
    { key: 'Material Type', label: 'Material Type', isText: true },
    { key: 'Tensile Strength (MPa)', label: 'Tensile Strength', unit: ' MPa', type: 'tensile' },
    { key: 'Compressive Strength (MPa)', label: 'Compressive Strength', unit: ' MPa' },
    { key: 'Elastic Modulus (GPa)', label: 'Elastic Modulus', unit: ' GPa' },
    { key: 'Toughness (MJ/m³)', label: 'Toughness', unit: ' MJ/m³' },
    { key: 'Hardness (Shore D)', label: 'Hardness', unit: ' Shore D' },
    { key: 'Fatigue Resistance (Cycles)', label: 'Fatigue Resistance', unit: ' Cycles' },
    { key: 'Density (g/cm³)', label: 'Density', unit: ' g/cm³' },
    { key: 'Thermal Conductivity (W/mK)', label: 'Thermal Conductivity', unit: ' W/mK' },
    { key: 'Electrical Conductivity (S/m)', label: 'Electrical Conductivity', unit: ' S/m' },
    { key: 'Corrosion Resistance (1–10)', label: 'Corrosion Resistance', unit: '/10' },
    { key: 'Formability/Malleability (1–10)', label: 'Formability', unit: '/10' },
    { key: 'Scalability (1–10)', label: 'Scalability', unit: '/10' },
    { key: 'Cost ($/kg)', label: 'Cost', unit: '/kg', prefix: '$', type: 'cost' },
    { key: 'Availability', label: 'Availability', isText: true },
    { key: 'Energy Efficiency (1–10)', label: 'Energy Efficiency', unit: '/10', type: 'efficiency' },
    { key: 'Biodegradability (%)', label: 'Biodegradability', unit: '%', type: 'biodegradability' },
  ];

  const getBestValue = (propertyKey, type) => {
    if (type === 'cost') {
      // For cost, lower is better
      return materials.reduce((best, material) => {
        const value = parseFloat(material[propertyKey]);
        const bestValue = parseFloat(best[propertyKey]);
        return isNaN(value) ? best : (isNaN(bestValue) || value < bestValue ? material : best);
      });
    } else {
      // For other properties, higher is generally better
      return materials.reduce((best, material) => {
        const value = parseFloat(material[propertyKey]);
        const bestValue = parseFloat(best[propertyKey]);
        return isNaN(value) ? best : (isNaN(bestValue) || value > bestValue ? material : best);
      });
    }
  };

  const renderPropertyRow = (property) => {
    const bestMaterial = getBestValue(property.key, property.type);
    
    return (
      <View key={property.key} style={styles.propertyRow}>
        <View style={styles.propertyLabel}>
          <Text style={styles.propertyLabelText}>{property.label}</Text>
        </View>
        {materials.map((material, index) => {
          const isBest = material['Material Name'] === bestMaterial['Material Name'];
          const value = property.isText 
            ? material[property.key]
            : `${property.prefix || ''}${formatValue(material[property.key], property.unit)}`;
          
          return (
            <View key={index} style={[styles.propertyCell, isBest && styles.bestCell]}>
              <Text style={[
                styles.propertyValue,
                { color: property.type ? getPropertyColor(material[property.key], property.type) : Colors.text },
                isBest && styles.bestText
              ]}>
                {value}
              </Text>
              {isBest && <Text style={styles.bestIndicator}>★</Text>}
            </View>
          );
        })}
      </View>
    );
  };

  const isHorizontalLayout = materials.length > 2;
  const modalContainerStyle = isHorizontalLayout ? styles.horizontalModalContainer : styles.modalContainer;
  const modalContentStyle = isHorizontalLayout ? styles.horizontalModalContent : styles.modalContent;

  const renderHorizontalLayout = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.horizontalModalContent}>
        {/* Property Labels Column */}
        <View style={styles.horizontalSection}>
          <View style={styles.horizontalPropertyLabel}>
            <Text style={styles.horizontalPropertyLabelText}>Property</Text>
          </View>
          {properties.map((property) => (
            <View key={property.key} style={styles.horizontalPropertyRow}>
              <Text style={styles.horizontalPropertyValue}>{property.label}</Text>
            </View>
          ))}
        </View>

        {/* Material Columns */}
        {materials.map((material, materialIndex) => (
          <View key={materialIndex} style={styles.horizontalSection}>
            <View style={styles.horizontalMaterialHeader}>
              <Text style={styles.horizontalMaterialName} numberOfLines={2}>
                {material['Material Name']}
              </Text>
              <Text style={styles.horizontalMaterialType}>{material['Material Type']}</Text>
            </View>
            {properties.map((property) => {
              const bestMaterial = getBestValue(property.key, property.type);
              const isBest = material['Material Name'] === bestMaterial['Material Name'];
              const value = property.isText 
                ? material[property.key]
                : `${property.prefix || ''}${formatValue(material[property.key], property.unit)}`;
              
              return (
                <View key={property.key} style={[
                  styles.horizontalPropertyRow,
                  isBest && styles.horizontalBestRow
                ]}>
                  <Text style={[
                    styles.horizontalPropertyValue,
                    { color: property.type ? getPropertyColor(material[property.key], property.type) : Colors.text },
                    isBest && styles.horizontalBestValue
                  ]}>
                    {value}
                  </Text>
                  {isBest && <Text style={styles.bestIndicator}>★</Text>}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={modalContainerStyle}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Compare Materials {isHorizontalLayout && '(Rotate phone for best view)'}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {isHorizontalLayout ? (
            renderHorizontalLayout()
          ) : (
            <ScrollView style={modalContentStyle} showsVerticalScrollIndicator={false}>
              {/* Material Names Header */}
              <View style={styles.headerRow}>
                <View style={styles.propertyLabel}>
                  <Text style={styles.propertyLabelText}>Property</Text>
                </View>
                {materials.map((material, index) => (
                  <View key={index} style={styles.materialHeader}>
                    <Text style={styles.materialName} numberOfLines={2}>
                      {material['Material Name']}
                    </Text>
                    <Text style={styles.materialType}>{material['Material Type']}</Text>
                  </View>
                ))}
              </View>

              {/* Properties Comparison */}
              {properties.map(renderPropertyRow)}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    maxHeight: '95%',
    width: screenWidth * 0.95,
    maxWidth: 800,
    minHeight: 600,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  horizontalModalContainer: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    maxHeight: '95%',
    width: screenWidth * 0.98,
    maxWidth: 1200,
    minHeight: 400,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
  },
  horizontalModalContent: {
    flex: 1,
    flexDirection: 'row',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
  },
  propertyLabel: {
    width: 120,
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    justifyContent: 'center',
  },
  propertyLabelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.text,
  },
  materialHeader: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  materialName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  materialType: {
    fontSize: 10,
    color: Colors.primary,
    textAlign: 'center',
  },
  propertyRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  propertyCell: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    position: 'relative',
  },
  bestCell: {
    backgroundColor: 'rgba(0, 255, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.2)',
  },
  propertyValue: {
    fontSize: 11,
    color: Colors.text,
    textAlign: 'center',
  },
  bestText: {
    fontWeight: 'bold',
    color: Colors.text,
  },
  bestIndicator: {
    position: 'absolute',
    top: 2,
    right: 4,
    fontSize: 10,
    color: 'rgba(255, 215, 0, 0.7)',
  },
  horizontalSection: {
    flex: 1,
    minWidth: 200,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  horizontalPropertyLabel: {
    padding: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    justifyContent: 'center',
  },
  horizontalPropertyLabelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  horizontalMaterialHeader: {
    padding: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  horizontalMaterialName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  horizontalMaterialType: {
    fontSize: 10,
    color: Colors.primary,
    textAlign: 'center',
  },
  horizontalPropertyRow: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  horizontalBestRow: {
    backgroundColor: 'rgba(0, 255, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.2)',
  },
  horizontalPropertyValue: {
    fontSize: 11,
    color: Colors.text,
    textAlign: 'center',
    fontWeight: 'normal',
  },
  horizontalBestValue: {
    fontWeight: 'bold',
  },
});

export default CompareModal;

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Colors } from '../constants/colors';
import Molecular3DViewer from './Molecular3DViewer';

const { height: screenHeight } = Dimensions.get('window');

const MaterialDetailModal = ({ visible, material, onClose, isFavorite, onToggleFavorite }) => {
  if (!material) return null;

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

  const handleStarPress = () => {
    onToggleFavorite(material, isFavorite);
  };

  const propertyGroups = [
    {
      title: 'Mechanical Properties',
      properties: [
        { key: 'Tensile Strength (MPa)', label: 'Tensile Strength', unit: ' MPa', type: 'tensile' },
        { key: 'Compressive Strength (MPa)', label: 'Compressive Strength', unit: ' MPa' },
        { key: 'Elastic Modulus (GPa)', label: 'Elastic Modulus', unit: ' GPa' },
        { key: 'Toughness (MJ/m³)', label: 'Toughness', unit: ' MJ/m³' },
        { key: 'Hardness (Shore D)', label: 'Hardness', unit: ' Shore D' },
        { key: 'Fatigue Resistance (Cycles)', label: 'Fatigue Resistance', unit: ' Cycles' },
      ]
    },
    {
      title: 'Physical Properties',
      properties: [
        { key: 'Density (g/cm³)', label: 'Density', unit: ' g/cm³' },
        { key: 'Thermal Conductivity (W/mK)', label: 'Thermal Conductivity', unit: ' W/mK' },
        { key: 'Electrical Conductivity (S/m)', label: 'Electrical Conductivity', unit: ' S/m' },
      ]
    },
    {
      title: 'Performance Ratings',
      properties: [
        { key: 'Corrosion Resistance (1–10)', label: 'Corrosion Resistance', unit: '/10' },
        { key: 'Formability/Malleability (1–10)', label: 'Formability/Malleability', unit: '/10' },
        { key: 'Scalability (1–10)', label: 'Scalability', unit: '/10' },
        { key: 'Energy Efficiency (1–10)', label: 'Energy Efficiency', unit: '/10', type: 'efficiency' },
      ]
    },
    {
      title: 'Economic & Environmental',
      properties: [
        { key: 'Cost ($/kg)', label: 'Cost', unit: '/kg', prefix: '$', type: 'cost' },
        { key: 'Biodegradability (%)', label: 'Biodegradability', unit: '%', type: 'biodegradability' },
        { key: 'Availability', label: 'Availability', isText: true },
      ]
    }
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.headerContent}>
              <Text style={styles.materialName}>{material['Material Name']}</Text>
              <Text style={styles.materialType}>{material['Material Type']}</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.descriptionContainer}>
              <Text style={styles.description}>{material.Description}</Text>
            </View>

            {/* 3D Molecular Structure */}
            <Molecular3DViewer
              smiles={material['Representative_SMILES']}
              structureType={material['Structure_Type']}
              molecularNotes={material['Molecular_Notes']}
            />

            {propertyGroups.map((group, groupIndex) => (
              <View key={groupIndex} style={styles.propertyGroup}>
                <Text style={styles.groupTitle}>{group.title}</Text>
                {group.properties.map((prop, propIndex) => (
                  <View key={propIndex} style={styles.propertyRow}>
                    <Text style={styles.propertyLabel}>{prop.label}</Text>
                    <Text style={[
                      styles.propertyValue,
                      { color: prop.type ? getPropertyColor(material[prop.key], prop.type) : Colors.text }
                    ]}>
                      {prop.isText 
                        ? material[prop.key]
                        : `${prop.prefix || ''}${formatValue(material[prop.key], prop.unit)}`
                      }
                    </Text>
                  </View>
                ))}
              </View>
            ))}

            {material.Notes && (
              <View style={styles.notesContainer}>
                <Text style={styles.notesTitle}>Notes</Text>
                <Text style={styles.notes}>{material.Notes}</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.favoriteButton} onPress={handleStarPress}>
              <Text style={[styles.star, { color: isFavorite ? Colors.star : Colors.starEmpty }]}>
                ★
              </Text>
              <Text style={styles.favoriteButtonText}>
                {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.95,
    minHeight: screenHeight * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerContent: {
    flex: 1,
  },
  materialName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  materialType: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  propertyGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 12,
  },
  propertyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  propertyLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  propertyValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'right',
    flex: 1,
  },
  notesContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  notes: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  star: {
    fontSize: 24,
    marginRight: 12,
  },
  favoriteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
});

export default MaterialDetailModal;

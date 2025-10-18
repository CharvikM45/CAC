import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const MaterialCard = ({ 
  material, 
  isFavorite, 
  onToggleFavorite, 
  onPress = () => {}, 
  isSelectedForCompare = false, 
  onToggleCompare = () => {},
  onShare = () => {}
}) => {
  const handleStarPress = () => {
    onToggleFavorite(material, isFavorite);
  };

  const handleCardPress = () => {
    onPress(material);
  };

  const handleComparePress = () => {
    onToggleCompare(material);
  };

  const handleSharePress = () => {
    onShare(material);
  };

  return (
    <TouchableOpacity 
      style={[styles.card, isSelectedForCompare && styles.selectedCard]} 
      onPress={handleCardPress} 
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.materialName}>{material['Material Name']}</Text>
          <Text style={styles.materialType}>{material['Material Type']}</Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.shareButton} onPress={handleSharePress}>
            <Ionicons name="share-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.compareButton} onPress={handleComparePress}>
            <Text style={[styles.compareIcon, { color: isSelectedForCompare ? Colors.primary : Colors.textSecondary }]}>
              {isSelectedForCompare ? '✓' : '+'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.starButton} onPress={handleStarPress}>
            <Text style={[styles.star, { color: isFavorite ? Colors.star : Colors.starEmpty }]}>
              ★
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.descriptionContainer}>
        <Text style={styles.description} numberOfLines={3}>
          {material.Description}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.surface,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  materialName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  materialType: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareButton: {
    padding: 4,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compareButton: {
    padding: 4,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compareIcon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  starButton: {
    padding: 4,
  },
  star: {
    fontSize: 24,
  },
  descriptionContainer: {
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});

export default MaterialCard;

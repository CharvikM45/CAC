import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const MaterialMessage = ({ material, isOwn, onPress, timestamp, read }) => {
  const handlePress = () => {
    if (onPress) {
      onPress(material);
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isOwn ? styles.ownContainer : styles.otherContainer
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Ionicons 
          name="cube-outline" 
          size={20} 
          color={isOwn ? Colors.secondary : Colors.primary} 
        />
        <Text style={[
          styles.headerText,
          { color: isOwn ? Colors.secondary : Colors.primary }
        ]}>
          Shared Material
        </Text>
      </View>
      
      <View style={styles.materialInfo}>
        <Text style={[
          styles.materialName,
          { color: isOwn ? Colors.secondary : Colors.text }
        ]}>
          {material['Material Name']}
        </Text>
        <Text style={[
          styles.materialType,
          { color: isOwn ? Colors.secondary : Colors.primary }
        ]}>
          {material['Material Type']}
        </Text>
        <Text 
          style={[
            styles.materialDescription,
            { color: isOwn ? Colors.secondary : Colors.textSecondary }
          ]}
          numberOfLines={3}
        >
          {material.Description}
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={[
            styles.tapHint,
            { color: isOwn ? Colors.secondary : Colors.textSecondary }
          ]}>
            Tap to view details
          </Text>
          <Ionicons 
            name="chevron-forward" 
            size={16} 
            color={isOwn ? Colors.secondary : Colors.textSecondary} 
          />
        </View>
        <View style={styles.footerRight}>
          <Text style={[
            styles.messageTime,
            { color: isOwn ? Colors.secondary : Colors.textSecondary }
          ]}>
            {formatMessageTime(timestamp)}
          </Text>
          {isOwn && (
            <Ionicons
              name={read ? 'checkmark-done' : 'checkmark'}
              size={12}
              color={read ? Colors.secondary : Colors.textSecondary}
              style={styles.readIcon}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: '80%',
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
  },
  ownContainer: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-end',
  },
  otherContainer: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  materialInfo: {
    marginBottom: 8,
  },
  materialName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  materialType: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  materialDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tapHint: {
    fontSize: 12,
    fontStyle: 'italic',
    marginRight: 4,
  },
  messageTime: {
    fontSize: 11,
    marginRight: 4,
  },
  readIcon: {
    marginLeft: 2,
  },
});

export default MaterialMessage;

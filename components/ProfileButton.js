import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const ProfileButton = ({ onPress, userData }) => {
  return (
    <TouchableOpacity 
      style={styles.profileButton} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons 
        name="person-circle" 
        size={32} 
        color={Colors.primary} 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});

export default ProfileButton;

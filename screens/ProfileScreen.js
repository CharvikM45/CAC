import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import InstitutionAutocomplete from '../components/InstitutionAutocomplete';
import UserSearch from '../components/UserSearch';
import ConnectionsScreen from './ConnectionsScreen';
import authService from '../utils/authService';
import socketService from '../utils/socketService';

const ProfileScreen = ({ userData, onUserUpdate, onLogout, navigation }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    institution: '',
    department: '',
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        institution: userData.institution || '',
        department: userData.department || '',
      });
      
      // Connect to socket service
      socketService.connect(userData.id);
    }
    
    return () => {
      socketService.disconnect();
    };
  }, [userData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const updatedUser = await authService.getCurrentUser();
      if (updatedUser && onUserUpdate) {
        onUserUpdate(updatedUser);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    if (!formData.institution.trim()) {
      Alert.alert('Error', 'Institution is required');
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await authService.updateProfile(userData.id, formData);
      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: userData.name || '',
      institution: userData.institution || '',
      department: userData.department || '',
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
              if (onLogout) {
                onLogout();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            Alert.alert(
              'Confirm Deletion',
              'This will permanently delete your account and all associated data. Are you absolutely sure?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete Forever', 
                  style: 'destructive',
                  onPress: async () => {
                    setLoading(true);
                    try {
                      await authService.deleteAccount(userData.id);
                      Alert.alert('Account Deleted', 'Your account has been deleted successfully');
                    } catch (error) {
                      Alert.alert('Error', error.message);
                    } finally {
                      setLoading(false);
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No user data available</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={40} color={Colors.primary} />
        </View>
        <Text style={styles.userName}>{userData.name}</Text>
        <Text style={styles.userEmail}>{userData.email}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
                placeholder="Enter your name"
                placeholderTextColor={Colors.textSecondary}
              />
            ) : (
              <Text style={styles.fieldValue}>{userData.name}</Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Institution</Text>
            {isEditing ? (
              <InstitutionAutocomplete
                value={formData.institution}
                onChangeText={(text) => setFormData({...formData, institution: text})}
                placeholder="University, Company, or Organization"
                style={styles.input}
              />
            ) : (
              <Text style={styles.fieldValue}>{userData.institution}</Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Department</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={formData.department}
                onChangeText={(text) => setFormData({...formData, department: text})}
                placeholder="Engineering, Research, etc."
                placeholderTextColor={Colors.textSecondary}
              />
            ) : (
              <Text style={styles.fieldValue}>{userData.department || 'Not specified'}</Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Member Since</Text>
            <Text style={styles.fieldValue}>{formatDate(userData.joinedDate)}</Text>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Last Login</Text>
            <Text style={styles.fieldValue}>{formatDate(userData.lastLogin)}</Text>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Connections</Text>
          
          <TouchableOpacity 
            style={[styles.button, styles.searchButton]} 
            onPress={() => setShowUserSearch(true)}
          >
            <Ionicons name="search" size={20} color={Colors.primary} />
            <Text style={styles.searchButtonText}>Find People</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.connectionsButton]} 
            onPress={() => setShowConnections(true)}
          >
            <Ionicons name="people" size={20} color={Colors.primary} />
            <Text style={styles.connectionsButtonText}>My Connections</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          
          {isEditing ? (
            <View style={styles.editActions}>
              <TouchableOpacity 
                style={[styles.button, styles.saveButton, loading && styles.buttonDisabled]} 
                onPress={handleSave}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.button, styles.editButton]} 
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="pencil" size={20} color={Colors.primary} />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.button, styles.logoutButton]} 
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={Colors.error || '#ff4444'} />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.deleteButton]} 
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash-outline" size={20} color={Colors.error || '#ff4444'} />
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* User Search Modal */}
      <Modal
        visible={showUserSearch}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowUserSearch(false)}
            >
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Find People</Text>
          </View>
          <UserSearch 
            currentUserId={userData.id}
            onUserSelect={() => setShowUserSearch(false)}
          />
        </View>
      </Modal>

      {/* Connections Modal */}
      <Modal
        visible={showConnections}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowConnections(false)}
            >
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>My Connections</Text>
          </View>
          <ConnectionsScreen 
            currentUserId={userData.id}
            onStartChat={(user) => {
              setShowConnections(false);
              if (navigation) {
                const conversationId = [userData.id, user.id].sort().join('-');
                navigation.navigate('Chat', {
                  conversationId,
                  otherUser: user,
                  currentUserId: userData.id,
                });
              }
            }}
          />
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: Colors.surface,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  content: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    color: Colors.text,
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
  actionsSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  editButton: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    flex: 1,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary,
  },
  cancelButton: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    flex: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  logoutButton: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.error || '#ff4444',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.error || '#ff4444',
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.error || '#ff4444',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.error || '#ff4444',
    marginLeft: 8,
  },
  searchButton: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
    marginLeft: 8,
  },
  connectionsButton: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  connectionsButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalCloseButton: {
    marginRight: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error || '#ff4444',
    textAlign: 'center',
    marginTop: 50,
  },
});

export default ProfileScreen;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import apiService from '../utils/apiService';
import authService from '../utils/authService';

const AdminUsersScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    loadAllUsers();
  }, []);

  const loadAllUsers = async () => {
    try {
      setLoading(true);
      
      // Get users from both backend and local storage
      const allUsers = await apiService.getAllUsers();
      
      // Get additional local users from authService
      const localUsers = await authService.getAllUsers();
      const localUsersArray = Object.values(localUsers);
      
      // Combine and deduplicate users
      const combinedUsers = [...allUsers, ...localUsersArray];
      const uniqueUsers = combinedUsers.filter((user, index, self) => 
        index === self.findIndex(u => u.id === user.id || u.email === user.email)
      );
      
      // Sort by join date (newest first)
      uniqueUsers.sort((a, b) => {
        const dateA = new Date(a.joinedDate || '2024-01-01');
        const dateB = new Date(b.joinedDate || '2024-01-01');
        return dateB - dateA;
      });
      
      setUsers(uniqueUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllUsers();
    setRefreshing(false);
  };

  const exportUserData = () => {
    const csvData = [
      ['Name', 'Email', 'Institution', 'Department', 'Join Date', 'Last Login', 'Profile Complete', 'User ID'],
      ...users.map(user => [
        user.name || '',
        user.email || '',
        user.institution || '',
        user.department || '',
        user.joinedDate || '',
        user.lastLogin || '',
        user.profileComplete ? 'Yes' : 'No',
        user.id || ''
      ])
    ].map(row => row.join(',')).join('\n');

    Alert.alert(
      'Export Data',
      `Found ${users.length} users. Copy the data below:`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Copy', onPress: () => {
          // In a real app, you'd copy to clipboard
          console.log('CSV Data:', csvData);
          Alert.alert('Copied', 'User data copied to console');
        }}
      ]
    );
  };

  const clearLocalUsers = () => {
    Alert.alert(
      'Clear Local Users',
      'This will delete all locally stored user data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.clearAllUsers();
              Alert.alert('Success', 'Local users cleared');
              loadAllUsers();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear users');
            }
          }
        }
      ]
    );
  };

  const getUserStats = () => {
    const totalUsers = users.length;
    const backendUsers = users.filter(u => u.id?.startsWith('user-')).length;
    const localUsers = totalUsers - backendUsers;
    const completeProfiles = users.filter(u => u.profileComplete).length;
    const institutions = [...new Set(users.map(u => u.institution).filter(Boolean))].length;
    
    return { totalUsers, backendUsers, localUsers, completeProfiles, institutions };
  };

  const renderUserCard = (user, index) => {
    const isBackendUser = user.id?.startsWith('user-');
    const joinDate = user.joinedDate ? new Date(user.joinedDate).toLocaleDateString() : 'Unknown';
    const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never';

    return (
      <View key={user.id || user.email} style={styles.userCard}>
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name || 'Unknown Name'}</Text>
            <Text style={styles.userEmail}>{user.email || 'No Email'}</Text>
          </View>
          <View style={styles.userBadge}>
            <Text style={[
              styles.badgeText,
              { backgroundColor: isBackendUser ? Colors.primary : Colors.secondary }
            ]}>
              {isBackendUser ? 'Backend' : 'Local'}
            </Text>
          </View>
        </View>
        
        <View style={styles.userDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="business" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{user.institution || 'No Institution'}</Text>
          </View>
          
          {user.department && (
            <View style={styles.detailRow}>
              <Ionicons name="library" size={16} color={Colors.textSecondary} />
              <Text style={styles.detailText}>{user.department}</Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>Joined: {joinDate}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="time" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>Last Login: {lastLogin}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons 
              name={user.profileComplete ? "checkmark-circle" : "close-circle"} 
              size={16} 
              color={user.profileComplete ? Colors.success : Colors.error} 
            />
            <Text style={[
              styles.detailText,
              { color: user.profileComplete ? Colors.success : Colors.error }
            ]}>
              Profile {user.profileComplete ? 'Complete' : 'Incomplete'}
            </Text>
          </View>
          
          {showPasswords && user.password && (
            <View style={styles.detailRow}>
              <Ionicons name="key" size={16} color={Colors.textSecondary} />
              <Text style={styles.detailText}>Password: {user.password}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.userIdContainer}>
          <Text style={styles.userId}>ID: {user.id || 'No ID'}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading user data...</Text>
      </View>
    );
  }

  const stats = getUserStats();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        <Text style={styles.subtitle}>All registered users in the system</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalUsers}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.backendUsers}</Text>
          <Text style={styles.statLabel}>Backend</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.localUsers}</Text>
          <Text style={styles.statLabel}>Local</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.institutions}</Text>
          <Text style={styles.statLabel}>Institutions</Text>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={exportUserData}>
          <Ionicons name="download" size={20} color="white" />
          <Text style={styles.controlButtonText}>Export CSV</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlButton, styles.toggleButton]} 
          onPress={() => setShowPasswords(!showPasswords)}
        >
          <Ionicons name={showPasswords ? "eye-off" : "eye"} size={20} color="white" />
          <Text style={styles.controlButtonText}>
            {showPasswords ? 'Hide' : 'Show'} Passwords
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlButton, styles.clearButton]} 
          onPress={clearLocalUsers}
        >
          <Ionicons name="trash" size={20} color="white" />
          <Text style={styles.controlButtonText}>Clear Local</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.usersList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {users.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        ) : (
          users.map((user, index) => renderUserCard(user, index))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 5,
  },
  controlsContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  toggleButton: {
    backgroundColor: Colors.secondary,
  },
  clearButton: {
    backgroundColor: Colors.error,
  },
  controlButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  usersList: {
    flex: 1,
    padding: 20,
  },
  userCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  userBadge: {
    marginLeft: 10,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  userDetails: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  userIdContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
  },
  userId: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: 15,
  },
});

export default AdminUsersScreen;

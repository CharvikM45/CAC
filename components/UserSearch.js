import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import apiService from '../utils/apiService';

const UserSearch = ({ currentUserId, onUserSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState(new Set());

  useEffect(() => {
    loadConnections();
  }, [currentUserId]);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadConnections = async () => {
    try {
      const userConnections = await apiService.getUserConnections(currentUserId);
      const connectionIds = new Set(userConnections.map(user => user.id));
      setConnections(connectionIds);
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  const searchUsers = async () => {
    setLoading(true);
    try {
      const results = await apiService.searchUsers(searchQuery, currentUserId);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddConnection = async (user) => {
    try {
      await apiService.addConnection(currentUserId, user.id);
      setConnections(prev => new Set([...prev, user.id]));
      if (onUserSelect) {
        onUserSelect(user);
      }
    } catch (error) {
      console.error('Error adding connection:', error);
    }
  };

  const handleRemoveConnection = async (user) => {
    try {
      await apiService.removeConnection(currentUserId, user.id);
      setConnections(prev => {
        const newSet = new Set(prev);
        newSet.delete(user.id);
        return newSet;
      });
    } catch (error) {
      console.error('Error removing connection:', error);
    }
  };

  const renderUserItem = ({ item: user }) => {
    // Safety check for user data
    if (!user || !user.name) {
      return null;
    }

    const isConnected = connections.has(user.id);
    
    return (
      <View style={styles.userItem}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userInstitution}>{user.institution || 'Unknown'}</Text>
            <Text style={styles.userDepartment}>{user.department || 'Unknown'}</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[
            styles.connectionButton,
            isConnected ? styles.connectedButton : styles.addButton
          ]}
          onPress={() => isConnected ? handleRemoveConnection(user) : handleAddConnection(user)}
        >
          <Ionicons
            name={isConnected ? 'checkmark' : 'add'}
            size={20}
            color={Colors.secondary}
          />
          <Text style={styles.buttonText}>
            {isConnected ? 'Connected' : 'Add'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users by name, institution, or department"
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {loading && <ActivityIndicator size="small" color={Colors.primary} />}
      </View>

      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
        style={styles.resultsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          searchQuery.trim() && !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginTop: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  resultsList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: Colors.secondary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  userInstitution: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  userDepartment: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  connectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    justifyContent: 'center',
  },
  addButton: {
    backgroundColor: Colors.primary,
  },
  connectedButton: {
    backgroundColor: Colors.textSecondary,
  },
  buttonText: {
    color: Colors.secondary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});

export default UserSearch;

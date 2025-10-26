import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Colors } from './constants/colors';
import authService from './utils/authService';
import socketService from './utils/socketService';
import AuthNavigator from './navigation/AuthNavigator';
import MainNavigator from './navigation/MainNavigator';

export default function App() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const user = await authService.getCurrentUser();
      setUserData(user);
      
      // Connect to WebSocket when user is authenticated
      if (user && user.id) {
        socketService.connect(user.id);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (user) => {
    setUserData(user);
    // Connect to WebSocket after login
    if (user && user.id) {
      socketService.connect(user.id);
    }
  };

  const handleRegister = (user) => {
    setUserData(user);
    // Connect to WebSocket after registration
    if (user && user.id) {
      socketService.connect(user.id);
    }
  };

  const handleUserUpdate = (updatedUser) => {
    setUserData(updatedUser);
  };

  const handleLogout = () => {
    setUserData(null);
    // Disconnect WebSocket on logout
    socketService.disconnect();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <View style={styles.container}>
        <StatusBar style="light" backgroundColor={Colors.background} />
        {userData ? (
          <MainNavigator 
            userData={userData} 
            onUserUpdate={handleUserUpdate}
            onLogout={handleLogout}
          />
        ) : (
          <AuthNavigator 
            onLogin={handleLogin}
            onRegister={handleRegister}
          />
        )}
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

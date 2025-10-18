import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Colors } from './constants/colors';
import authService from './utils/authService';
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
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (user) => {
    setUserData(user);
  };

  const handleRegister = (user) => {
    setUserData(user);
  };

  const handleUserUpdate = (updatedUser) => {
    setUserData(updatedUser);
  };

  const handleLogout = () => {
    setUserData(null);
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

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import HomeScreen from '../screens/HomeScreen';
import SimulationsScreen from '../screens/SimulationsScreen';
import ChatbotScreen from '../screens/ChatbotScreen';
import ImageDetectionScreen from '../screens/ImageDetectionScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const { width: screenWidth } = Dimensions.get('window');

const AppNavigator = ({ userData, onUserUpdate, onLogout }) => {
  return (
    <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: 25,
            left: 50,
            right: 50,
            backgroundColor: Colors.surface,
            borderRadius: 35,
            height: 75,
            paddingBottom: 8,
            paddingTop: 8,
            paddingHorizontal: 25,
            borderTopWidth: 0,
            elevation: 15,
            shadowColor: Colors.primary,
            shadowOffset: {
              width: 0,
              height: 8,
            },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            borderWidth: 1,
            borderColor: Colors.border,
          },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textSecondary,
          tabBarLabelStyle: {
            fontSize: 13,
            fontWeight: '700',
            marginTop: 2,
            marginBottom: 2,
          },
          tabBarIconStyle: {
            marginTop: 2,
            marginBottom: 2,
          },
        }}
      >
        <Tab.Screen
          name="Home"
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons 
                name={focused ? 'home' : 'home-outline'} 
                size={size || 24} 
                color={color} 
              />
            ),
            tabBarLabel: 'Explore',
          }}
        >
          {(props) => <HomeScreen {...props} userData={userData} navigation={props.navigation} />}
        </Tab.Screen>
        
        <Tab.Screen
          name="Simulations"
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons 
                name={focused ? 'analytics' : 'analytics-outline'} 
                size={size || 24} 
                color={color} 
              />
            ),
            tabBarLabel: 'Simulations',
          }}
          component={SimulationsScreen}
        />

        <Tab.Screen
          name="ImageDetection"
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons 
                name={focused ? 'camera' : 'camera-outline'} 
                size={size || 24} 
                color={color} 
              />
            ),
            tabBarLabel: 'Detect',
          }}
          component={ImageDetectionScreen}
        />

        <Tab.Screen
          name="Chatbot"
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons 
                name={focused ? 'bulb' : 'bulb-outline'} 
                size={size || 24} 
                color={color} 
              />
            ),
            tabBarLabel: 'Chatbot',
          }}
          component={ChatbotScreen}
        />

        <Tab.Screen
          name="Profile"
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons 
                name={focused ? 'person' : 'person-outline'} 
                size={size || 24} 
                color={color} 
              />
            ),
            tabBarLabel: 'Profile',
          }}
        >
          {(props) => (
            <ProfileScreen 
              {...props} 
              userData={userData} 
              onUserUpdate={onUserUpdate}
              onLogout={onLogout}
              navigation={props.navigation}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
  );
};

export default AppNavigator;

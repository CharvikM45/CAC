import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import HomeScreen from '../screens/HomeScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ConversationsScreen from '../screens/ConversationsScreen';

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
          {(props) => <HomeScreen {...props} userData={userData} />}
        </Tab.Screen>
        
        <Tab.Screen
          name="Favorites"
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons 
                name={focused ? 'star' : 'star-outline'} 
                size={size || 24} 
                color={color} 
              />
            ),
            tabBarLabel: 'Favorites',
          }}
          component={FavoritesScreen}
        />

        <Tab.Screen
          name="Messages"
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons 
                name={focused ? 'chatbubbles' : 'chatbubbles-outline'} 
                size={size || 24} 
                color={color} 
              />
            ),
            tabBarLabel: 'Messages',
          }}
        >
          {(props) => (
            <ConversationsScreen 
              {...props} 
              currentUserId={userData.id}
              onOpenChat={(conversation) => {
                props.navigation.navigate('Chat', {
                  conversationId: conversation.id,
                  otherUser: conversation.user,
                  currentUserId: userData.id,
                });
              }}
            />
          )}
        </Tab.Screen>

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

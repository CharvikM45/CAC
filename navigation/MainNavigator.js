import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AppNavigator from './AppNavigator';
import ConversationsScreen from '../screens/ConversationsScreen';
import ChatScreen from '../screens/ChatScreen';

const Stack = createStackNavigator();

const MainNavigator = ({ userData, onUserUpdate, onLogout }) => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs">
        {(props) => (
          <AppNavigator 
            {...props}
            userData={userData}
            onUserUpdate={onUserUpdate}
            onLogout={onLogout}
          />
        )}
      </Stack.Screen>
      
      <Stack.Screen 
        name="Conversations" 
        component={ConversationsScreen}
        options={{
          headerShown: true,
          title: 'Messages',
          headerStyle: {
            backgroundColor: '#1a1a1a',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;

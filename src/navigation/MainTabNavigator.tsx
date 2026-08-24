import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/Main/HomeScreen';
import GroupsScreen from '../screens/Main/GroupsScreen';
import LeaderboardScreen from '../screens/Main/LeaderboardScreen';
import ProfileScreen from '../screens/Main/ProfileScreen';

const Tab = createBottomTabNavigator();

// Placeholder for Submit Screen which will be a modal/BottomSheet later
const SubmitPlaceholder = () => null;

export default function MainTabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Groups" component={GroupsScreen} />
      <Tab.Screen 
        name="Submit" 
        component={SubmitPlaceholder} 
        options={{
          tabBarButton: (props) => (
            <TouchableOpacity 
              {...props} 
              style={{
                top: -15,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#F97316', // Safety Orange from design
                width: 64,
                height: 48,
                borderRadius: 24, // Pill shape
                shadowColor: '#C2410C', // Hard physical bottom edge
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 1,
                shadowRadius: 0,
                elevation: 5,
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>+</Text>
            </TouchableOpacity>
          )
        }}
      />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

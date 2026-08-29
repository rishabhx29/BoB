import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform, Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/Main/HomeScreen';
import GroupsScreen from '../screens/Main/GroupsScreen';
import LeaderboardScreen from '../screens/Main/LeaderboardScreen';
import ProfileScreen from '../screens/Main/ProfileScreen';
import { COLORS, SHADOWS, SIZES } from '@/constants/theme';
import { MainTabParamList } from '@/types';
import * as Haptics from 'expo-haptics';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Placeholder for Submit Screen / Bottom Sheet Action
const SubmitPlaceholder = () => null;

const TactileSubmitPill = ({ onPress }: { onPress: () => void }) => {
  const [isPressed, setIsPressed] = useState(false);
  const translateY = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(translateY, { toValue: 3, useNativeDriver: true, speed: 60 }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 60 }).start();
  };

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onPress();
  };

  return (
    <Animated.View style={[styles.submitPillWrapper, { transform: [{ translateY }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={[
          styles.submitPill,
          isPressed ? SHADOWS.fabPressed : SHADOWS.fabDefault,
        ]}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.brandPrimary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'flash' : 'flash-outline'} 
              size={22} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Groups" 
        component={GroupsScreen} 
        options={{
          tabBarLabel: 'Pacts',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'people' : 'people-outline'} 
              size={22} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Submit" 
        component={SubmitPlaceholder} 
        options={({ navigation }: any) => ({
          tabBarLabel: () => null,
          tabBarButton: () => (
            <TactileSubmitPill 
              onPress={() => {
                navigation.navigate('Groups');
              }} 
            />
          ),
        })}
      />
      <Tab.Screen 
        name="Leaderboard" 
        component={LeaderboardScreen} 
        options={{
          tabBarLabel: 'Rankings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'trophy' : 'trophy-outline'} 
              size={22} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'person' : 'person-outline'} 
              size={22} 
              color={color} 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surfaceBase,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceDark,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    ...SHADOWS.highElevation,
  },
  tabBarLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    marginTop: 2,
  },
  submitPillWrapper: {
    top: -16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitPill: {
    width: 60,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.brandPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

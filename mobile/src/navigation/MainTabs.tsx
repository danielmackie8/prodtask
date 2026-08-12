import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BoardScreen } from '../screens/BoardScreen';
import { HiringStack } from './HiringStack';
import { NotesStack } from './NotesStack';
import { AiScreen } from '../screens/AiScreen';
import { useTheme } from '../ThemeContext';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, string> = {
  Board: '▦',
  Hiring: '◈',
  Notes: '▤',
  Ai: '✦',
};

export function MainTabs() {
  const { T } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#4f8ef7',
        tabBarInactiveTintColor: T.dim,
        tabBarStyle: { backgroundColor: T.surface, borderTopColor: T.border },
        tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>{ICONS[route.name]}</Text>,
        tabBarLabel: route.name === 'Ai' ? 'AI Assistant' : route.name === 'Hiring' ? 'Hiring Manager' : route.name,
      })}
    >
      <Tab.Screen name="Board" component={BoardScreen} />
      <Tab.Screen name="Hiring" component={HiringStack} />
      <Tab.Screen name="Notes" component={NotesStack} />
      <Tab.Screen name="Ai" component={AiScreen} />
    </Tab.Navigator>
  );
}

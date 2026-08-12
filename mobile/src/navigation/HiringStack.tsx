import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RoleListScreen } from '../screens/RoleListScreen';
import { RoleDetailScreen } from '../screens/RoleDetailScreen';
import type { HiringStackParamList } from './types';

const Stack = createNativeStackNavigator<HiringStackParamList>();

export function HiringStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RoleList" component={RoleListScreen} />
      <Stack.Screen name="RoleDetail" component={RoleDetailScreen} options={{ headerShown: true, title: '' }} />
    </Stack.Navigator>
  );
}

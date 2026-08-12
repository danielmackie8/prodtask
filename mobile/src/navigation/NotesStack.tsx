import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NoteListScreen } from '../screens/NoteListScreen';
import { NoteDetailScreen } from '../screens/NoteDetailScreen';
import type { NotesStackParamList } from './types';

const Stack = createNativeStackNavigator<NotesStackParamList>();

export function NotesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NoteList" component={NoteListScreen} />
      <Stack.Screen name="NoteDetail" component={NoteDetailScreen} options={{ headerShown: true, title: '' }} />
    </Stack.Navigator>
  );
}

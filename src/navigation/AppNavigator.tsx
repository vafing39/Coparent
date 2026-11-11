import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AccueilPlaceholderScreen } from '../screens/app/AccueilPlaceholderScreen';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

/** PROVISOIRE : sera remplacé par les onglets (Tabs) une fois construits. */
export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Accueil" component={AccueilPlaceholderScreen} />
    </Stack.Navigator>
  );
}

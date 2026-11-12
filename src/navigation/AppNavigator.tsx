import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ATraiterScreen } from '../features/home/ATraiterScreen';
import { SacAPreparerScreen } from '../features/home/SacAPreparerScreen';
import { TabsNavigator } from './TabsNavigator';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

/** Espace connecté : les onglets, et par-dessus les écrans sans barre d'onglets (« À traiter », « Sac à préparer »). */
export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onglets" component={TabsNavigator} />
      <Stack.Screen name="ATraiter" component={ATraiterScreen} />
      <Stack.Screen name="SacAPreparer" component={SacAPreparerScreen} />
    </Stack.Navigator>
  );
}

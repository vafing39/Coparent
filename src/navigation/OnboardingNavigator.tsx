import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { VerificationScreen } from '../screens/onboarding/VerificationScreen';
import type { OnboardingStackParamList } from './types';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

/** Première connexion (5 étapes). Seule la vérification de l'email existe pour l'instant. */
export function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Verification" component={VerificationScreen} />
    </Stack.Navigator>
  );
}

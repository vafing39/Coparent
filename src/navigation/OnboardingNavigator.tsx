import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EnfantsScreen } from '../screens/onboarding/EnfantsScreen';
import { FamilleScreen } from '../screens/onboarding/FamilleScreen';
import { RythmePlaceholderScreen } from '../screens/onboarding/RythmePlaceholderScreen';
import { VerificationScreen } from '../screens/onboarding/VerificationScreen';
import type { OnboardingStackParamList } from './types';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

/**
 * Première connexion (5 étapes). Démarre sur la vérification de l'email tant qu'elle
 * n'est pas faite, sinon sur la famille.
 */
export function OnboardingNavigator({
  emailVerified,
}: {
  emailVerified: boolean;
}) {
  return (
    <Stack.Navigator
      initialRouteName={emailVerified ? 'Famille' : 'Verification'}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Verification" component={VerificationScreen} />
      <Stack.Screen name="Famille" component={FamilleScreen} />
      <Stack.Screen name="Enfants" component={EnfantsScreen} />
      <Stack.Screen name="Rythme" component={RythmePlaceholderScreen} />
    </Stack.Navigator>
  );
}

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingDraftProvider } from '../context/OnboardingDraftContext';
import { EnfantsScreen } from '../screens/onboarding/EnfantsScreen';
import { FamilleScreen } from '../screens/onboarding/FamilleScreen';
import { InvitationScreen } from '../screens/onboarding/InvitationScreen';
import { RythmeScreen } from '../screens/onboarding/RythmeScreen';
import { VacancesScreen } from '../screens/onboarding/VacancesScreen';
import { VerificationScreen } from '../screens/onboarding/VerificationScreen';
import type { OnboardingStackParamList } from './types';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

/**
 * Première connexion (5 étapes). Démarre sur la vérification de l'email tant qu'elle
 * n'est pas faite, sinon sur la famille. La famille vient de FamilyProvider (au-dessus) ;
 * les choix en cours sont gardés dans le brouillon. onFinish : fin de l'étape 5.
 */
export function OnboardingNavigator({
  emailVerified,
  onFinish,
}: {
  emailVerified: boolean;
  onFinish: () => void;
}) {
  return (
    <OnboardingDraftProvider onFinish={onFinish}>
      <Stack.Navigator
        initialRouteName={emailVerified ? 'Famille' : 'Verification'}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Verification" component={VerificationScreen} />
        <Stack.Screen name="Famille" component={FamilleScreen} />
        <Stack.Screen name="Enfants" component={EnfantsScreen} />
        <Stack.Screen name="Rythme" component={RythmeScreen} />
        <Stack.Screen name="Vacances" component={VacancesScreen} />
        <Stack.Screen name="Invitation" component={InvitationScreen} />
      </Stack.Navigator>
    </OnboardingDraftProvider>
  );
}

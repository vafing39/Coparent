import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FamilyProvider } from '../context/FamilyContext';
import { OnboardingDraftProvider } from '../context/OnboardingDraftContext';
import { EnfantsScreen } from '../screens/onboarding/EnfantsScreen';
import { FamilleScreen } from '../screens/onboarding/FamilleScreen';
import { InvitationPlaceholderScreen } from '../screens/onboarding/InvitationPlaceholderScreen';
import { RythmeScreen } from '../screens/onboarding/RythmeScreen';
import { VacancesScreen } from '../screens/onboarding/VacancesScreen';
import { VerificationScreen } from '../screens/onboarding/VerificationScreen';
import type { OnboardingStackParamList } from './types';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

/**
 * Première connexion (5 étapes). Démarre sur la vérification de l'email tant qu'elle
 * n'est pas faite, sinon sur la famille. La famille est chargée une fois pour toutes
 * les étapes (FamilyProvider) ; les choix en cours sont gardés dans le brouillon.
 */
export function OnboardingNavigator({
  emailVerified,
}: {
  emailVerified: boolean;
}) {
  return (
    <FamilyProvider>
      <OnboardingDraftProvider>
        <Stack.Navigator
          initialRouteName={emailVerified ? 'Famille' : 'Verification'}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Verification" component={VerificationScreen} />
          <Stack.Screen name="Famille" component={FamilleScreen} />
          <Stack.Screen name="Enfants" component={EnfantsScreen} />
          <Stack.Screen name="Rythme" component={RythmeScreen} />
          <Stack.Screen name="Vacances" component={VacancesScreen} />
          <Stack.Screen
            name="Invitation"
            component={InvitationPlaceholderScreen}
          />
        </Stack.Navigator>
      </OnboardingDraftProvider>
    </FamilyProvider>
  );
}

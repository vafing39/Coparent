import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingHeader } from '../../components/OnboardingHeader';
import { ChildrenForm } from '../../features/children/ChildrenForm';
import { RequireFamily } from '../../features/family/RequireFamily';
import type { OnboardingScreenProps } from '../../navigation/types';

/**
 * Étape 3 de la première connexion : prénom et date de naissance de chaque enfant.
 * Chargement et erreur : FamilyProvider.
 */
export function EnfantsScreen({
  navigation,
}: OnboardingScreenProps<'Enfants'>) {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <OnboardingHeader step={3} onBack={() => navigation.goBack()} />
      <RequireFamily onBack={() => navigation.goBack()}>
        {family => (
          <ChildrenForm
            family={family}
            onSaved={() => navigation.navigate('Rythme')}
          />
        )}
      </RequireFamily>
    </SafeAreaView>
  );
}

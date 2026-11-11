import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingHeader } from '../../components/OnboardingHeader';
import { FamilyForm } from '../../features/family/FamilyForm';
import type { OnboardingScreenProps } from '../../navigation/types';

/**
 * Étape 2 de la première connexion : nom de la famille et zone de vacances scolaires.
 * Pas de flèche de retour : l'email est déjà vérifié, l'étape 1 n'a plus lieu d'être.
 * Les étapes suivantes ont une flèche qui revient à l'étape précédente (OnboardingHeader).
 *
 * Si la famille existe déjà (retour depuis l'étape 3, reprise de la première connexion),
 * le formulaire est prérempli et l'enregistrement la modifie au lieu d'en créer une autre.
 * Chargement et erreur : FamilyProvider.
 */
export function FamilleScreen({
  navigation,
}: OnboardingScreenProps<'Famille'>) {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {/* Pas de retour : une fois l'email vérifié, l'étape 2 est la première. */}
      <OnboardingHeader step={2} />
      {/* Pas de famille (null) : formulaire vide, c'est l'état « vide » de l'écran. */}
      <FamilyForm onSaved={() => navigation.navigate('Enfants')} />
    </SafeAreaView>
  );
}

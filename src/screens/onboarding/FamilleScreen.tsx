import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LoadError } from '../../components/LoadError';
import { OnboardingHeader } from '../../components/OnboardingHeader';
import { useMyFamily } from '../../api/family';
import { FamilyForm } from '../../features/family/FamilyForm';
import { FamilySkeleton } from '../../features/family/FamilySkeleton';
import type { OnboardingScreenProps } from '../../navigation/types';

/**
 * Étape 2 de la première connexion : nom de la famille et zone de vacances scolaires.
 * Pas de flèche de retour : l'email est déjà vérifié, l'étape 1 n'a plus lieu d'être.
 * Les étapes suivantes ont une flèche qui revient à l'étape précédente (OnboardingHeader).
 *
 * Si la famille existe déjà (retour depuis l'étape 3, reprise de la première connexion),
 * le formulaire est prérempli et l'enregistrement la modifie au lieu d'en créer une autre.
 */
export function FamilleScreen({
  navigation,
}: OnboardingScreenProps<'Famille'>) {
  const { t } = useTranslation();
  const myFamily = useMyFamily();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {/* Pas de retour : une fois l'email vérifié, l'étape 2 est la première. */}
      <OnboardingHeader step={2} />

      {myFamily.isPending ? (
        <FamilySkeleton />
      ) : myFamily.isError ? (
        <LoadError
          message={t('onboarding.family.loadFailed')}
          onRetry={() => myFamily.refetch()}
        />
      ) : (
        // Pas de famille (null) : formulaire vide, c'est l'état « vide » de l'écran.
        <FamilyForm
          existing={myFamily.data}
          onSaved={() => navigation.navigate('Enfants')}
        />
      )}
    </SafeAreaView>
  );
}

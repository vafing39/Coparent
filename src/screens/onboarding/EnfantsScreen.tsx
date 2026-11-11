import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LoadError } from '../../components/LoadError';
import { OnboardingHeader } from '../../components/OnboardingHeader';
import { useMyFamily } from '../../api/family';
import { ChildrenForm } from '../../features/children/ChildrenForm';
import { ChildrenSkeleton } from '../../features/children/ChildrenSkeleton';
import type { OnboardingScreenProps } from '../../navigation/types';

/**
 * Étape 3 de la première connexion : prénom et date de naissance de chaque enfant.
 */
export function EnfantsScreen({
  navigation,
}: OnboardingScreenProps<'Enfants'>) {
  const { t } = useTranslation();
  const myFamily = useMyFamily();

  let content: React.ReactNode;
  if (myFamily.isPending) {
    content = <ChildrenSkeleton />;
  } else if (myFamily.isError) {
    content = (
      <LoadError
        message={t('onboarding.children.loadFailed')}
        onRetry={() => myFamily.refetch()}
      />
    );
  } else if (!myFamily.data) {
    // Ne devrait pas arriver : l'étape 2 crée la famille.
    content = (
      <LoadError
        message={t('onboarding.children.errors.familyNotFound')}
        actionLabel={t('common.back')}
        onRetry={() => navigation.goBack()}
      />
    );
  } else {
    content = (
      <ChildrenForm
        family={myFamily.data}
        onSaved={() => navigation.navigate('Rythme')}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <OnboardingHeader step={3} onBack={() => navigation.goBack()} />
      {content}
    </SafeAreaView>
  );
}

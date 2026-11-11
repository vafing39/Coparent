import React from 'react';
import { useTranslation } from 'react-i18next';
import { LoadError } from '../../components/LoadError';
import type { Family } from '../../api/types';
import { useFamily } from '../../hooks/useFamily';

type Props = {
  /** Retour à l'étape qui crée la famille. */
  onBack: () => void;
  children: (family: Family) => React.ReactNode;
};

/** Pour les étapes qui suivent la création de la famille : message si elle n'existe pas. */
export function RequireFamily({ onBack, children }: Props) {
  const { t } = useTranslation();
  const { family } = useFamily();
  if (!family) {
    // Ne devrait pas arriver : l'étape 2 crée la famille.
    return (
      <LoadError
        message={t('onboarding.children.errors.familyNotFound')}
        actionLabel={t('common.back')}
        onRetry={onBack}
      />
    );
  }
  return <>{children(family)}</>;
}

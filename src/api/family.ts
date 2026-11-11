import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import i18n from '../i18n';
import type { FamilyValues } from '../schemas/family';
import { ApiError } from './errors';
import { createFamily, fetchMyFamily, updateFamily } from './familyRequests';
import type { Family } from './types';

export const familyKeys = {
  mine: ['family', 'me'] as const,
};

/** La famille de l'utilisateur connecté (null : pas encore créée). */
export function useMyFamily() {
  return useQuery({ queryKey: familyKeys.mine, queryFn: fetchMyFamily });
}

/**
 * Étape 2 : crée la famille, ou la modifie si elle existe déjà
 * (retour depuis l'étape 3, ou reprise de la première connexion).
 */
export function useSaveFamily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      existing,
      values,
    }: {
      existing: Family | null;
      values: FamilyValues;
    }) => (existing ? updateFamily(existing.id, values) : createFamily(values)),
    onSuccess: family => queryClient.setQueryData(familyKeys.mine, family),
  });
}

/** Message d'échec de l'enregistrement de la famille. */
export function familyErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return i18n.t('onboarding.family.errors.emailNotVerified');
    }
    if (error.status === 409) {
      return i18n.t('onboarding.family.errors.alreadyInFamily');
    }
    if (error.status === 400) {
      return i18n.t('onboarding.family.errors.saveFailed');
    }
  }
  return i18n.t('errors.network');
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import i18n from '../i18n';
import type { ChildValues } from '../schemas/children';
import type { FamilyValues } from '../schemas/family';
import { ApiError } from './errors';
import {
  addChild,
  createFamily,
  deleteChild,
  fetchMyFamily,
  updateChild,
  updateFamily,
} from './familyRequests';
import type { Child, Family } from './types';

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

type SaveChildrenArgs = {
  family: Family;
  children: ChildValues[];
  /** Appelé après chaque création : le formulaire garde l'id pour ne pas recréer l'enfant. */
  onCreated?: (index: number, child: Child) => void;
};

/**
 * Étape 3 : aligne les enfants du serveur sur le formulaire, une requête après l'autre.
 * Nouveaux → création, modifiés → modification, retirés → suppression.
 */
export async function saveChildren({
  family,
  children,
  onCreated,
}: SaveChildrenArgs): Promise<void> {
  const saved = new Map(family.children.map(child => [child.id, child]));
  for (const [index, child] of children.entries()) {
    const payload = { firstName: child.firstName, birthDate: child.birthDate };
    if (!child.childId) {
      onCreated?.(index, await addChild(family.id, payload));
      continue;
    }
    const before = saved.get(child.childId);
    if (
      before?.firstName !== payload.firstName ||
      before?.birthDate !== payload.birthDate
    ) {
      await updateChild(family.id, child.childId, payload);
    }
  }
  const kept = new Set(children.map(child => child.childId));
  for (const child of family.children) {
    if (!kept.has(child.id)) {
      await deleteChild(family.id, child.id);
    }
  }
}

export function useSaveChildren() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveChildren,
    // Succès ou échec partiel : on recharge la famille pour repartir de l'état du serveur.
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: familyKeys.mine }),
  });
}

/** Message d'échec de l'enregistrement des enfants. */
export function childrenErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return i18n.t('onboarding.children.errors.saveFailed');
    }
    if (error.status === 403 || error.status === 404) {
      return i18n.t('onboarding.children.errors.familyNotFound');
    }
  }
  return i18n.t('errors.network');
}

import React, { createContext, useMemo } from 'react';
import {
  UseMutateFunction,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LoadError } from '../components/LoadError';
import { ScreenSkeleton } from '../components/ScreenSkeleton';
import { apiClient } from '../api/client';
import { ApiError } from '../api/errors';
import { custodyKeys } from '../api/custody';
import { familyKeys } from '../api/family';
import { toDoKeys } from '../api/toDo';
import type {
  Child,
  CustodySchedule,
  CustodyScheduleRequest,
  Family,
  Invitation,
} from '../api/types';
import type { ChildValues } from '../schemas/children';
import type { FamilyValues } from '../schemas/family';

// Requêtes HTTP de la famille, appelées uniquement par FamilyProvider.

const FAMILIES_PATH = '/api/v1/families';

function toFamilyRequest(values: FamilyValues) {
  return { name: values.name, vacationZone: values.zone };
}

function childPath(familyId: string, childId?: string) {
  const base = `${FAMILIES_PATH}/${familyId}/children`;
  return childId ? `${base}/${childId}` : base;
}

/** La famille de l'utilisateur connecté, ou null s'il n'en a pas encore. */
async function fetchMyFamilyRequest(): Promise<Family | null> {
  try {
    const { data } = await apiClient.get<Family>(`${FAMILIES_PATH}/me`);
    return data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

/** Crée la famille ; l'utilisateur en devient le parent A. */
async function createFamilyRequest(values: FamilyValues): Promise<Family> {
  const { data } = await apiClient.post<Family>(
    FAMILIES_PATH,
    toFamilyRequest(values),
  );
  return data;
}

/** Modifie le nom et la zone d'une famille existante. */
async function updateFamilyRequest(
  familyId: string,
  values: FamilyValues,
): Promise<Family> {
  const { data } = await apiClient.put<Family>(
    `${FAMILIES_PATH}/${familyId}`,
    toFamilyRequest(values),
  );
  return data;
}

async function addChildRequest(
  familyId: string,
  child: ChildPayload,
): Promise<Child> {
  const { data } = await apiClient.post<Child>(childPath(familyId), child);
  return data;
}

async function updateChildRequest(
  familyId: string,
  childId: string,
  child: ChildPayload,
): Promise<Child> {
  const { data } = await apiClient.put<Child>(
    childPath(familyId, childId),
    child,
  );
  return data;
}

async function deleteChildRequest(
  familyId: string,
  childId: string,
): Promise<void> {
  await apiClient.delete(childPath(familyId, childId));
}

/** Propose le rythme de garde ; remplace ma proposition en attente s'il y en a une. */
async function proposeScheduleRequest(
  familyId: string,
  schedule: CustodyScheduleRequest,
): Promise<CustodySchedule> {
  const { data } = await apiClient.put<CustodySchedule>(
    `${FAMILIES_PATH}/${familyId}/custody-schedule`,
    schedule,
  );
  return data;
}

/** Crée un lien d'invitation pour l'autre parent ; les liens précédents ne fonctionnent plus. */
async function createInvitationRequest(
  familyId: string,
  inviteeFirstName: string,
): Promise<Invitation> {
  const { data } = await apiClient.post<Invitation>(
    `${FAMILIES_PATH}/${familyId}/invitations`,
    { inviteeFirstName },
  );
  return data;
}

/** Corps d'un enfant (birthDate « AAAA-MM-JJ »). */
export type ChildPayload = { firstName: string; birthDate: string };

export type SaveChildrenVariables = {
  children: ChildValues[];
  /** Appelé après chaque création : le formulaire garde l'id pour ne pas recréer l'enfant. */
  onCreated?: (index: number, child: Child) => void;
};

/** Chaque action : la lancer, savoir si elle est en cours, son erreur, la remettre à zéro. */
export type FamilyContextValue = {
  /** null : l'utilisateur n'a pas encore de famille (étape 2 à faire). */
  family: Family | null;

  // Une action par requête (la famille vient du contexte).
  createFamily: UseMutateFunction<Family, Error, FamilyValues>;
  isCreatingFamily: boolean;
  createFamilyError: Error | null;
  resetCreateFamily: () => void;

  updateFamily: UseMutateFunction<Family, Error, FamilyValues>;
  isUpdatingFamily: boolean;
  updateFamilyError: Error | null;
  resetUpdateFamily: () => void;

  addChild: UseMutateFunction<Child, Error, ChildPayload>;
  isAddingChild: boolean;
  addChildError: Error | null;
  resetAddChild: () => void;

  updateChild: UseMutateFunction<Child, Error, UpdateChildVariables>;
  isUpdatingChild: boolean;
  updateChildError: Error | null;
  resetUpdateChild: () => void;

  deleteChild: UseMutateFunction<void, Error, string>;
  isDeletingChild: boolean;
  deleteChildError: Error | null;
  resetDeleteChild: () => void;

  proposeSchedule: UseMutateFunction<
    CustodySchedule,
    Error,
    CustodyScheduleRequest
  >;
  isProposingSchedule: boolean;
  proposeScheduleError: Error | null;
  resetProposeSchedule: () => void;

  /** Étape 5 : lien d'invitation de l'autre parent (prénom de l'invité). */
  createInvitation: UseMutateFunction<Invitation, Error, string>;
  isCreatingInvitation: boolean;
  createInvitationError: Error | null;
  resetCreateInvitation: () => void;

  // Enregistrements des formulaires, faits de plusieurs requêtes.
  /** Étape 2 : crée la famille, ou la modifie si elle existe déjà. */
  saveFamily: UseMutateFunction<Family, Error, FamilyValues>;
  isSavingFamily: boolean;
  saveFamilyError: Error | null;
  resetSaveFamily: () => void;

  /**
   * Étape 3 : aligne les enfants du serveur sur le formulaire, une requête après l'autre.
   * Nouveaux → création, modifiés → modification, retirés → suppression.
   */
  saveChildren: UseMutateFunction<void, Error, SaveChildrenVariables>;
  isSavingChildren: boolean;
  saveChildrenError: Error | null;
  resetSaveChildren: () => void;
};

export type UpdateChildVariables = { childId: string; child: ChildPayload };

export const FamilyContext = createContext<FamilyContextValue | null>(null);

/** Les étapes 3 et 4 sont derrière RequireFamily : la famille existe forcément. */
function requireFamily(family: Family | null | undefined): Family {
  if (!family) {
    throw new Error('Aucune famille : créez-la d’abord (étape 2).');
  }
  return family;
}

/**
 * Charge la famille une fois pour tous les écrans qu'il entoure et détient tous les
 * appels d'API de la famille avec leur état. Chargement et erreur sont affichés ici ;
 * les écrans reçoivent une famille déjà chargée (useFamily). Chaque enregistrement met
 * à jour la famille en cache : les écrans suivent sans recharger.
 */
export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: familyKeys.mine,
    queryFn: fetchMyFamilyRequest,
  });
  const family = query.data;

  const setFamily = (saved: Family) =>
    queryClient.setQueryData(familyKeys.mine, saved);
  /** Applique un changement à la famille en cache (si elle est chargée). */
  const patchFamily = (patch: (current: Family) => Family) =>
    queryClient.setQueryData<Family | null>(familyKeys.mine, current =>
      current ? patch(current) : current,
    );

  const reloadFamily = () =>
    queryClient.invalidateQueries({ queryKey: familyKeys.mine });

  // Toutes les mutations sont déclarées avant le retour anticipé (règles des hooks).
  const {
    mutate: createFamily,
    isPending: isCreatingFamily,
    error: createFamilyError,
    reset: resetCreateFamily,
  } = useMutation({
    mutationFn: createFamilyRequest,
    onSuccess: setFamily,
  });

  const {
    mutate: updateFamily,
    isPending: isUpdatingFamily,
    error: updateFamilyError,
    reset: resetUpdateFamily,
  } = useMutation({
    mutationFn: (values: FamilyValues) =>
      updateFamilyRequest(requireFamily(family).id, values),
    onSuccess: setFamily,
  });

  const {
    mutate: addChild,
    isPending: isAddingChild,
    error: addChildError,
    reset: resetAddChild,
  } = useMutation({
    mutationFn: (child: ChildPayload) =>
      addChildRequest(requireFamily(family).id, child),
    onSuccess: child =>
      patchFamily(current => ({
        ...current,
        children: [...current.children, child],
      })),
  });

  const {
    mutate: updateChild,
    isPending: isUpdatingChild,
    error: updateChildError,
    reset: resetUpdateChild,
  } = useMutation({
    mutationFn: ({ childId, child }: UpdateChildVariables) =>
      updateChildRequest(requireFamily(family).id, childId, child),
    onSuccess: child =>
      patchFamily(current => ({
        ...current,
        children: current.children.map(c => (c.id === child.id ? child : c)),
      })),
  });

  const {
    mutate: deleteChild,
    isPending: isDeletingChild,
    error: deleteChildError,
    reset: resetDeleteChild,
  } = useMutation({
    mutationFn: (childId: string) =>
      deleteChildRequest(requireFamily(family).id, childId),
    onSuccess: (_result, childId) =>
      patchFamily(current => ({
        ...current,
        children: current.children.filter(c => c.id !== childId),
      })),
  });

  const {
    mutate: proposeSchedule,
    isPending: isProposingSchedule,
    error: proposeScheduleError,
    reset: resetProposeSchedule,
  } = useMutation({
    mutationFn: (schedule: CustodyScheduleRequest) =>
      proposeScheduleRequest(requireFamily(family).id, schedule),
    onSuccess: custodySchedule => {
      patchFamily(current => ({ ...current, custodySchedule }));
      // Avec deux parents, une proposition (ou contre-proposition) change « À traiter ».
      const familyId = requireFamily(family).id;
      queryClient.invalidateQueries({ queryKey: toDoKeys.list(familyId) });
      queryClient.invalidateQueries({ queryKey: custodyKeys.all(familyId) });
    },
  });

  const {
    mutate: createInvitation,
    isPending: isCreatingInvitation,
    error: createInvitationError,
    reset: resetCreateInvitation,
  } = useMutation({
    mutationFn: (inviteeFirstName: string) =>
      createInvitationRequest(requireFamily(family).id, inviteeFirstName),
    // L'état de l'invitation (prénom, validité) est dans la famille.
    onSuccess: reloadFamily,
  });

  const {
    mutate: saveFamily,
    isPending: isSavingFamily,
    error: saveFamilyError,
    reset: resetSaveFamily,
  } = useMutation({
    mutationFn: (values: FamilyValues) =>
      family
        ? updateFamilyRequest(family.id, values)
        : createFamilyRequest(values),
    onSuccess: setFamily,
  });

  const {
    mutate: saveChildren,
    isPending: isSavingChildren,
    error: saveChildrenError,
    reset: resetSaveChildren,
  } = useMutation({
    mutationFn: async ({
      children: formChildren,
      onCreated,
    }: SaveChildrenVariables) => {
      const current = requireFamily(family);
      const saved = new Map(current.children.map(child => [child.id, child]));
      for (const [index, child] of formChildren.entries()) {
        const payload = {
          firstName: child.firstName,
          birthDate: child.birthDate,
        };
        if (!child.childId) {
          onCreated?.(index, await addChildRequest(current.id, payload));
          continue;
        }
        const before = saved.get(child.childId);
        if (
          before?.firstName !== payload.firstName ||
          before?.birthDate !== payload.birthDate
        ) {
          await updateChildRequest(current.id, child.childId, payload);
        }
      }
      const kept = new Set(formChildren.map(child => child.childId));
      for (const child of current.children) {
        if (!kept.has(child.id)) {
          await deleteChildRequest(current.id, child.id);
        }
      }
    },
    // Succès ou échec partiel : on recharge la famille pour repartir de l'état du serveur.
    onSettled: reloadFamily,
  });

  const actions = {
    createFamily,
    isCreatingFamily,
    createFamilyError,
    resetCreateFamily,
    updateFamily,
    isUpdatingFamily,
    updateFamilyError,
    resetUpdateFamily,
    addChild,
    isAddingChild,
    addChildError,
    resetAddChild,
    updateChild,
    isUpdatingChild,
    updateChildError,
    resetUpdateChild,
    deleteChild,
    isDeletingChild,
    deleteChildError,
    resetDeleteChild,
    proposeSchedule,
    isProposingSchedule,
    proposeScheduleError,
    resetProposeSchedule,
    createInvitation,
    isCreatingInvitation,
    createInvitationError,
    resetCreateInvitation,
    saveFamily,
    isSavingFamily,
    saveFamilyError,
    resetSaveFamily,
    saveChildren,
    isSavingChildren,
    saveChildrenError,
    resetSaveChildren,
  };
  const value = useMemo<FamilyContextValue | null>(
    () => (family === undefined ? null : { family, ...actions }),
    // Les fonctions de mutation sont stables : seuls la famille et les états changent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [family, ...Object.values(actions)],
  );

  if (!value) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        {query.isError ? (
          <LoadError
            message={t('family.loadFailed')}
            onRetry={() => query.refetch()}
          />
        ) : (
          <ScreenSkeleton />
        )}
      </SafeAreaView>
    );
  }
  return (
    <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>
  );
}

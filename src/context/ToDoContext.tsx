import React, { createContext, useMemo } from 'react';
import {
  UseMutateFunction,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { toDoKeys } from '../api/toDo';
import type { ToDo } from '../api/types';
import { useFamily } from '../hooks/useFamily';

// Requêtes HTTP de « À traiter », appelées uniquement par ToDoProvider.

function toDoPath(familyId: string) {
  return `/api/v1/families/${familyId}/to-do`;
}

async function fetchToDoRequest(familyId: string): Promise<ToDo> {
  const { data } = await apiClient.get<ToDo>(toDoPath(familyId));
  return data;
}

async function nudgeRequest(familyId: string, itemId: string): Promise<ToDo> {
  const { data } = await apiClient.post<ToDo>(
    `${toDoPath(familyId)}/${itemId}/nudge`,
  );
  return data;
}

export type ToDoContextValue = {
  /** undefined pendant le chargement ou après une erreur. */
  toDo: ToDo | undefined;
  isLoadingToDo: boolean;
  toDoError: Error | null;
  reloadToDo: () => void;
  /** « Relancer » l'autre parent pour une demande (id), une fois par jour au maximum. */
  nudgeToDo: UseMutateFunction<ToDo, Error, string>;
  /** Demande en cours de relance, sinon undefined. */
  nudgingToDoId: string | undefined;
  nudgeToDoError: Error | null;
  /** Demande dont la relance a échoué, sinon undefined. */
  nudgeToDoErrorId: string | undefined;
  resetNudgeToDo: () => void;
};

export const ToDoContext = createContext<ToDoContextValue | null>(null);

/**
 * Charge « À traiter » (ce qui attend ma réponse et celle de l'autre parent) pour l'accueil
 * et son écran, et détient « Relancer » (la réponse, « À traiter » à jour, est mise en
 * cache). Placé sous FamilyProvider ; chargement et erreur sont affichés par les écrans.
 */
export function ToDoProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { family } = useFamily();
  const familyId = family?.id ?? '';
  const { data, isPending, error, refetch } = useQuery({
    queryKey: toDoKeys.list(familyId),
    queryFn: () => fetchToDoRequest(familyId),
    enabled: familyId !== '',
  });

  const {
    mutate: nudgeToDo,
    isPending: isNudging,
    variables: nudgeVariables,
    error: nudgeToDoError,
    reset: resetNudgeToDo,
  } = useMutation({
    mutationFn: (itemId: string) => nudgeRequest(familyId, itemId),
    onSuccess: (toDo: ToDo) =>
      queryClient.setQueryData(toDoKeys.list(familyId), toDo),
  });

  const value = useMemo<ToDoContextValue>(
    () => ({
      toDo: data,
      isLoadingToDo: isPending,
      toDoError: error,
      reloadToDo: () => {
        refetch();
      },
      nudgeToDo,
      nudgingToDoId: isNudging ? nudgeVariables : undefined,
      nudgeToDoError,
      nudgeToDoErrorId: nudgeToDoError ? nudgeVariables : undefined,
      resetNudgeToDo,
    }),
    [
      data,
      isPending,
      error,
      refetch,
      nudgeToDo,
      isNudging,
      nudgeVariables,
      nudgeToDoError,
      resetNudgeToDo,
    ],
  );
  return <ToDoContext.Provider value={value}>{children}</ToDoContext.Provider>;
}

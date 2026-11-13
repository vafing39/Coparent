import React, { createContext, useMemo, useState } from 'react';
import {
  UseMutateFunction,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { custodyKeys } from '../api/custody';
import { familyKeys } from '../api/family';
import { scheduleKeys } from '../api/schedules';
import { toDoKeys } from '../api/toDo';
import type { CustodySchedule } from '../api/types';
import { useFamily } from '../hooks/useFamily';

// Requêtes HTTP d'un rythme à valider, appelées uniquement par ScheduleProposalProvider.

function schedulePath(familyId: string, id: string) {
  return `/api/v1/families/${familyId}/custody-schedules/${id}`;
}

async function fetchSchedule(
  familyId: string,
  id: string,
): Promise<CustodySchedule> {
  const { data } = await apiClient.get<CustodySchedule>(
    schedulePath(familyId, id),
  );
  return data;
}

async function acceptScheduleRequest(
  familyId: string,
  id: string,
): Promise<CustodySchedule> {
  const { data } = await apiClient.post<CustodySchedule>(
    `${schedulePath(familyId, id)}/accept`,
  );
  return data;
}

export type ScheduleProposalContextValue = {
  /** L'écran du rythme proposé l'ouvre, puis le ferme en partant. */
  openSchedule: (id: string) => void;
  closeSchedule: () => void;
  schedule: CustodySchedule | undefined;
  isLoadingSchedule: boolean;
  scheduleError: Error | null;
  reloadSchedule: () => void;
  /** L'autre parent valide le rythme : il s'applique. */
  acceptSchedule: UseMutateFunction<CustodySchedule, Error, string>;
  isAcceptingSchedule: boolean;
  acceptScheduleError: Error | null;
  resetAcceptSchedule: () => void;
};

export const ScheduleProposalContext =
  createContext<ScheduleProposalContextValue | null>(null);

/**
 * Rythme proposé à valider par l'autre parent (cahier des charges, 3), ouvert depuis
 * « À traiter ». Après la validation : la famille, « À traiter » et toute la garde sont
 * rechargés (le bandeau « Rythme proposé » disparaît). La contre-proposition passe par
 * `proposeSchedule` de FamilyProvider.
 */
export function ScheduleProposalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const { family } = useFamily();
  const familyId = family?.id ?? '';

  const [openId, setOpenId] = useState<string | null>(null);
  const {
    data: schedule,
    isPending,
    error: scheduleError,
    refetch,
  } = useQuery({
    queryKey: scheduleKeys.one(familyId, openId ?? ''),
    queryFn: () => fetchSchedule(familyId, openId ?? ''),
    enabled: familyId !== '' && openId !== null,
  });
  const isLoadingSchedule = openId !== null && isPending;

  const {
    mutate: acceptSchedule,
    isPending: isAcceptingSchedule,
    error: acceptScheduleError,
    reset: resetAcceptSchedule,
  } = useMutation({
    mutationFn: (id: string) => acceptScheduleRequest(familyId, id),
    onSuccess: saved => {
      queryClient.setQueryData(scheduleKeys.one(familyId, saved.id), saved);
      queryClient.invalidateQueries({ queryKey: familyKeys.mine });
      queryClient.invalidateQueries({ queryKey: toDoKeys.list(familyId) });
      queryClient.invalidateQueries({ queryKey: custodyKeys.all(familyId) });
    },
  });

  const value = useMemo<ScheduleProposalContextValue>(
    () => ({
      openSchedule: setOpenId,
      closeSchedule: () => setOpenId(null),
      schedule: openId === null ? undefined : schedule,
      isLoadingSchedule,
      scheduleError: openId === null ? null : scheduleError,
      reloadSchedule: () => {
        refetch();
      },
      acceptSchedule,
      isAcceptingSchedule,
      acceptScheduleError,
      resetAcceptSchedule,
    }),
    [
      openId,
      schedule,
      isLoadingSchedule,
      scheduleError,
      refetch,
      acceptSchedule,
      isAcceptingSchedule,
      acceptScheduleError,
      resetAcceptSchedule,
    ],
  );
  return (
    <ScheduleProposalContext.Provider value={value}>
      {children}
    </ScheduleProposalContext.Provider>
  );
}

import React, { createContext, useMemo, useState } from 'react';
import {
  UseMutateFunction,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { custodyKeys } from '../api/custody';
import { exchangeKeys } from '../api/exchanges';
import { toDoKeys } from '../api/toDo';
import type { Exchange, ExchangeBody } from '../api/types';
import { useFamily } from '../hooks/useFamily';

// Requêtes HTTP des échanges de garde, appelées uniquement par ExchangesProvider.

function exchangesPath(familyId: string) {
  return `/api/v1/families/${familyId}/exchanges`;
}

async function fetchExchange(familyId: string, id: string): Promise<Exchange> {
  const { data } = await apiClient.get<Exchange>(
    `${exchangesPath(familyId)}/${id}`,
  );
  return data;
}

async function createExchangeRequest(
  familyId: string,
  body: ExchangeBody,
): Promise<Exchange> {
  const { data } = await apiClient.post<Exchange>(
    exchangesPath(familyId),
    body,
  );
  return data;
}

export type ExchangeAnswer = 'accept' | 'decline' | 'cancel';

async function answerExchangeRequest(
  familyId: string,
  { id, answer }: AnswerExchangeVariables,
): Promise<Exchange> {
  const { data } = await apiClient.post<Exchange>(
    `${exchangesPath(familyId)}/${id}/${answer}`,
  );
  return data;
}

export type AnswerExchangeVariables = { id: string; answer: ExchangeAnswer };

export type ExchangesContextValue = {
  /** L'écran de détail ouvre une demande, puis la ferme en partant. */
  openExchange: (id: string) => void;
  closeExchange: () => void;
  exchange: Exchange | undefined;
  isLoadingExchange: boolean;
  exchangeError: Error | null;
  reloadExchange: () => void;
  createExchange: UseMutateFunction<Exchange, Error, ExchangeBody>;
  isCreatingExchange: boolean;
  createExchangeError: Error | null;
  resetCreateExchange: () => void;
  /** Accepter, refuser (l'autre parent) ou annuler (le demandeur). */
  answerExchange: UseMutateFunction<Exchange, Error, AnswerExchangeVariables>;
  isAnsweringExchange: boolean;
  answerExchangeError: Error | null;
  resetAnswerExchange: () => void;
};

export const ExchangesContext = createContext<ExchangesContextValue | null>(
  null,
);

/**
 * Détient les demandes d'échange de garde (cahier des charges, 6). Après une création ou une
 * réponse : « À traiter » est rechargé, et la garde aussi (calendrier, accueil), puisqu'un
 * échange accepté la change.
 */
export function ExchangesProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { family } = useFamily();
  const familyId = family?.id ?? '';

  const [openId, setOpenId] = useState<string | null>(null);
  const {
    data: exchange,
    isPending,
    error: exchangeError,
    refetch,
  } = useQuery({
    queryKey: exchangeKeys.one(familyId, openId ?? ''),
    queryFn: () => fetchExchange(familyId, openId ?? ''),
    enabled: familyId !== '' && openId !== null,
  });
  const isLoadingExchange = openId !== null && isPending;

  const onChanged = (saved: Exchange) => {
    queryClient.setQueryData(exchangeKeys.one(familyId, saved.id), saved);
    queryClient.invalidateQueries({ queryKey: exchangeKeys.all(familyId) });
    queryClient.invalidateQueries({ queryKey: toDoKeys.list(familyId) });
    queryClient.invalidateQueries({ queryKey: custodyKeys.all(familyId) });
  };

  const {
    mutate: createExchange,
    isPending: isCreatingExchange,
    error: createExchangeError,
    reset: resetCreateExchange,
  } = useMutation({
    mutationFn: (body: ExchangeBody) => createExchangeRequest(familyId, body),
    onSuccess: onChanged,
  });
  const {
    mutate: answerExchange,
    isPending: isAnsweringExchange,
    error: answerExchangeError,
    reset: resetAnswerExchange,
  } = useMutation({
    mutationFn: (variables: AnswerExchangeVariables) =>
      answerExchangeRequest(familyId, variables),
    onSuccess: onChanged,
  });

  const value = useMemo<ExchangesContextValue>(
    () => ({
      openExchange: setOpenId,
      closeExchange: () => setOpenId(null),
      exchange: openId === null ? undefined : exchange,
      isLoadingExchange,
      exchangeError: openId === null ? null : exchangeError,
      reloadExchange: () => {
        refetch();
      },
      createExchange,
      isCreatingExchange,
      createExchangeError,
      resetCreateExchange,
      answerExchange,
      isAnsweringExchange,
      answerExchangeError,
      resetAnswerExchange,
    }),
    [
      openId,
      exchange,
      isLoadingExchange,
      exchangeError,
      refetch,
      createExchange,
      isCreatingExchange,
      createExchangeError,
      resetCreateExchange,
      answerExchange,
      isAnsweringExchange,
      answerExchangeError,
      resetAnswerExchange,
    ],
  );
  return (
    <ExchangesContext.Provider value={value}>
      {children}
    </ExchangesContext.Provider>
  );
}

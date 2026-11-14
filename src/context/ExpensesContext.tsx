import React, { createContext, useMemo } from 'react';
import {
  UseMutateFunction,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { apiClient } from '../api/client';
import {
  expenseKeys,
  receiptPath,
  ReceiptPhoto,
  ReceiptUploadError,
} from '../api/expenses';
import { toDoKeys } from '../api/toDo';
import type {
  Balance,
  ContestReason,
  Expense,
  ExpenseBody,
  Settlement,
} from '../api/types';
import { useFamily } from '../hooks/useFamily';

// Requêtes HTTP des dépenses et du solde, appelées uniquement par ExpensesProvider.

function expensesPath(familyId: string) {
  return `/api/v1/families/${familyId}/expenses`;
}

async function fetchExpenses(familyId: string): Promise<Expense[]> {
  const { data } = await apiClient.get<Expense[]>(expensesPath(familyId));
  return data;
}

async function fetchBalance(familyId: string): Promise<Balance> {
  const { data } = await apiClient.get<Balance>(
    `${expensesPath(familyId)}/balance`,
  );
  return data;
}

async function saveExpenseRequest(
  familyId: string,
  { id, body, receipt }: SaveExpenseVariables,
): Promise<Expense> {
  const { data } = id
    ? await apiClient.put<Expense>(`${expensesPath(familyId)}/${id}`, body)
    : await apiClient.post<Expense>(expensesPath(familyId), body);
  if (!receipt) {
    return data;
  }
  try {
    return receipt === 'remove'
      ? await deleteReceiptRequest(familyId, data.id)
      : await putReceiptRequest(familyId, data.id, receipt);
  } catch (error) {
    throw new ReceiptUploadError(data, error);
  }
}

async function putReceiptRequest(
  familyId: string,
  expenseId: string,
  photo: ReceiptPhoto,
): Promise<Expense> {
  const form = new FormData();
  // React Native envoie le fichier local désigné par son uri.
  form.append('file', {
    uri: photo.uri,
    type: photo.type,
    name: photo.fileName,
  } as unknown as Blob);
  const { data } = await apiClient.put<Expense>(
    receiptPath(familyId, expenseId),
    form,
    { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60_000 },
  );
  return data;
}

async function deleteReceiptRequest(
  familyId: string,
  expenseId: string,
): Promise<Expense> {
  const { data } = await apiClient.delete<Expense>(
    receiptPath(familyId, expenseId),
  );
  return data;
}

async function answerExpenseRequest(
  familyId: string,
  variables: AnswerExpenseVariables,
): Promise<Expense> {
  const path = `${expensesPath(familyId)}/${variables.id}/${variables.action}`;
  const { data } =
    variables.action === 'contest'
      ? await apiClient.post<Expense>(path, {
          reason: variables.reason,
          note: variables.note,
        })
      : await apiClient.post<Expense>(path);
  return data;
}

async function declareSettlementRequest(
  familyId: string,
  amountCents: number,
): Promise<Settlement> {
  const { data } = await apiClient.post<Settlement>(
    `${expensesPath(familyId)}/settlements`,
    { amountCents },
  );
  return data;
}

async function answerSettlementRequest(
  familyId: string,
  { id, action }: AnswerSettlementVariables,
): Promise<Settlement> {
  const { data } = await apiClient.post<Settlement>(
    `${expensesPath(familyId)}/settlements/${id}/${action}`,
  );
  return data;
}

/**
 * Sans `id` : nouvelle dépense ; avec : correction par l'auteur. `receipt` : nouvelle photo à
 * envoyer après la dépense, ou 'remove' pour retirer le justificatif (absent : inchangé).
 */
export type SaveExpenseVariables = {
  id?: string;
  body: ExpenseBody;
  receipt?: ReceiptPhoto | 'remove';
};

/** Accepter ou contester (l'autre parent), retirer (l'auteur). */
export type AnswerExpenseVariables =
  | { id: string; action: 'accept' | 'withdraw' }
  | { id: string; action: 'contest'; reason: ContestReason; note?: string };

/** Confirmer ou « pas encore reçu » (le créancier), annuler (le déclarant). */
export type AnswerSettlementVariables = {
  id: string;
  action: 'confirm' | 'not-received' | 'cancel';
};

export type ExpensesContextValue = {
  expenses: Expense[] | undefined;
  isLoadingExpenses: boolean;
  expensesError: Error | null;
  reloadExpenses: () => void;
  /** Solde courant (deux parents seulement). */
  balance: Balance | undefined;
  isLoadingBalance: boolean;
  balanceError: Error | null;
  reloadBalance: () => void;
  saveExpense: UseMutateFunction<Expense, Error, SaveExpenseVariables>;
  isSavingExpense: boolean;
  saveExpenseError: Error | null;
  resetSaveExpense: () => void;
  answerExpense: UseMutateFunction<Expense, Error, AnswerExpenseVariables>;
  isAnsweringExpense: boolean;
  answerExpenseError: Error | null;
  resetAnswerExpense: () => void;
  declareSettlement: UseMutateFunction<Settlement, Error, number>;
  isDeclaringSettlement: boolean;
  declareSettlementError: Error | null;
  resetDeclareSettlement: () => void;
  answerSettlement: UseMutateFunction<
    Settlement,
    Error,
    AnswerSettlementVariables
  >;
  isAnsweringSettlement: boolean;
  answerSettlementError: Error | null;
  resetAnswerSettlement: () => void;
};

export const ExpensesContext = createContext<ExpensesContextValue | null>(null);

/**
 * Détient les dépenses partagées, le solde et les virements. Après chaque action, la liste, le
 * solde et « À traiter » sont rechargés : une dépense en attente, contestée ou un virement
 * déclaré y apparaît chez le parent qui doit répondre.
 */
export function ExpensesProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { family } = useFamily();
  const familyId = family?.id ?? '';
  const together = family !== null && family !== undefined && !family.solo;

  const {
    data: expenses,
    isPending: isLoadingExpenses,
    error: expensesError,
    refetch: refetchExpenses,
  } = useQuery({
    queryKey: expenseKeys.list(familyId),
    queryFn: () => fetchExpenses(familyId),
    enabled: familyId !== '',
  });
  const {
    data: balance,
    isPending: balancePending,
    error: balanceError,
    refetch: refetchBalance,
  } = useQuery({
    queryKey: expenseKeys.balance(familyId),
    queryFn: () => fetchBalance(familyId),
    enabled: familyId !== '' && together,
  });
  const isLoadingBalance = together && balancePending;

  const onChanged = () => {
    queryClient.invalidateQueries({ queryKey: expenseKeys.all(familyId) });
    queryClient.invalidateQueries({ queryKey: toDoKeys.list(familyId) });
  };

  const save = useMutation({
    mutationFn: (variables: SaveExpenseVariables) =>
      saveExpenseRequest(familyId, variables),
    onSuccess: onChanged,
    // La dépense est enregistrée même si son justificatif ne l'est pas.
    onError: error => {
      if (error instanceof ReceiptUploadError) {
        onChanged();
      }
    },
  });
  const answer = useMutation({
    mutationFn: (variables: AnswerExpenseVariables) =>
      answerExpenseRequest(familyId, variables),
    onSuccess: onChanged,
  });
  const declare = useMutation({
    mutationFn: (amountCents: number) =>
      declareSettlementRequest(familyId, amountCents),
    onSuccess: onChanged,
  });
  const answerSettlementMutation = useMutation({
    mutationFn: (variables: AnswerSettlementVariables) =>
      answerSettlementRequest(familyId, variables),
    onSuccess: onChanged,
  });

  const value = useMemo<ExpensesContextValue>(
    () => ({
      expenses,
      isLoadingExpenses,
      expensesError,
      reloadExpenses: () => {
        refetchExpenses();
      },
      balance: together ? balance : undefined,
      isLoadingBalance,
      balanceError: together ? balanceError : null,
      reloadBalance: () => {
        refetchBalance();
      },
      saveExpense: save.mutate,
      isSavingExpense: save.isPending,
      saveExpenseError: save.error,
      resetSaveExpense: save.reset,
      answerExpense: answer.mutate,
      isAnsweringExpense: answer.isPending,
      answerExpenseError: answer.error,
      resetAnswerExpense: answer.reset,
      declareSettlement: declare.mutate,
      isDeclaringSettlement: declare.isPending,
      declareSettlementError: declare.error,
      resetDeclareSettlement: declare.reset,
      answerSettlement: answerSettlementMutation.mutate,
      isAnsweringSettlement: answerSettlementMutation.isPending,
      answerSettlementError: answerSettlementMutation.error,
      resetAnswerSettlement: answerSettlementMutation.reset,
    }),
    [
      expenses,
      isLoadingExpenses,
      expensesError,
      refetchExpenses,
      together,
      balance,
      isLoadingBalance,
      balanceError,
      refetchBalance,
      save.mutate,
      save.isPending,
      save.error,
      save.reset,
      answer.mutate,
      answer.isPending,
      answer.error,
      answer.reset,
      declare.mutate,
      declare.isPending,
      declare.error,
      declare.reset,
      answerSettlementMutation.mutate,
      answerSettlementMutation.isPending,
      answerSettlementMutation.error,
      answerSettlementMutation.reset,
    ],
  );
  return (
    <ExpensesContext.Provider value={value}>
      {children}
    </ExpensesContext.Provider>
  );
}

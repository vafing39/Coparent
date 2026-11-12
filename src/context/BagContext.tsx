import React, { createContext, useMemo } from 'react';
import {
  UseMutateFunction,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { bagKeys } from '../api/bag';
import type { Bag } from '../api/types';
import { useFamily } from '../hooks/useFamily';

// Requêtes HTTP du sac à préparer, appelées uniquement par BagProvider.

function bagPath(familyId: string) {
  return `/api/v1/families/${familyId}/bag`;
}

async function fetchBagRequest(familyId: string): Promise<Bag> {
  const { data } = await apiClient.get<Bag>(bagPath(familyId));
  return data;
}

async function addBagItemRequest(
  familyId: string,
  item: AddBagItemVariables,
): Promise<Bag> {
  const { data } = await apiClient.post<Bag>(
    `${bagPath(familyId)}/items`,
    item,
  );
  return data;
}

async function deleteBagItemRequest(
  familyId: string,
  itemId: string,
): Promise<Bag> {
  const { data } = await apiClient.delete<Bag>(
    `${bagPath(familyId)}/items/${itemId}`,
  );
  return data;
}

/** Coche (checked) ou décoche un élément pour le prochain passage. */
async function setBagItemCheckedRequest(
  familyId: string,
  { itemId, checked }: SetBagItemCheckedVariables,
): Promise<Bag> {
  const path = `${bagPath(familyId)}/items/${itemId}/check`;
  const { data } = checked
    ? await apiClient.put<Bag>(path)
    : await apiClient.delete<Bag>(path);
  return data;
}

export type AddBagItemVariables = { childId: string; label: string };
export type SetBagItemCheckedVariables = { itemId: string; checked: boolean };

/** Chaque action : la lancer, savoir si elle est en cours, son erreur, la remettre à zéro. */
export type BagContextValue = {
  /** undefined pendant le chargement ou après une erreur. */
  bag: Bag | undefined;
  isLoadingBag: boolean;
  bagError: Error | null;
  reloadBag: () => void;
  addBagItem: UseMutateFunction<Bag, Error, AddBagItemVariables>;
  isAddingBagItem: boolean;
  addBagItemError: Error | null;
  resetAddBagItem: () => void;
  deleteBagItem: UseMutateFunction<Bag, Error, string>;
  isDeletingBagItem: boolean;
  deleteBagItemError: Error | null;
  resetDeleteBagItem: () => void;
  setBagItemChecked: UseMutateFunction<Bag, Error, SetBagItemCheckedVariables>;
  isSettingBagItemChecked: boolean;
  setBagItemCheckedError: Error | null;
  resetSetBagItemChecked: () => void;
};

export const BagContext = createContext<BagContextValue | null>(null);

/**
 * Charge le sac du prochain passage (liste partagée par les deux parents) et détient ses
 * actions. Chaque action renvoie le sac entier, mis en cache : les écrans suivent sans
 * recharger. Placé sous FamilyProvider ; chargement et erreur sont affichés par les écrans.
 */
export function BagProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { family } = useFamily();
  const familyId = family?.id ?? '';
  const onSaved = (bag: Bag) =>
    queryClient.setQueryData(bagKeys.detail(familyId), bag);

  const { data, isPending, error, refetch } = useQuery({
    queryKey: bagKeys.detail(familyId),
    queryFn: () => fetchBagRequest(familyId),
    enabled: familyId !== '',
  });

  const {
    mutate: addBagItem,
    isPending: isAddingBagItem,
    error: addBagItemError,
    reset: resetAddBagItem,
  } = useMutation({
    mutationFn: (item: AddBagItemVariables) =>
      addBagItemRequest(familyId, item),
    onSuccess: onSaved,
  });
  const {
    mutate: deleteBagItem,
    isPending: isDeletingBagItem,
    error: deleteBagItemError,
    reset: resetDeleteBagItem,
  } = useMutation({
    mutationFn: (itemId: string) => deleteBagItemRequest(familyId, itemId),
    onSuccess: onSaved,
  });
  const {
    mutate: setBagItemChecked,
    isPending: isSettingBagItemChecked,
    error: setBagItemCheckedError,
    reset: resetSetBagItemChecked,
  } = useMutation({
    mutationFn: (variables: SetBagItemCheckedVariables) =>
      setBagItemCheckedRequest(familyId, variables),
    onSuccess: onSaved,
  });

  const value = useMemo<BagContextValue>(
    () => ({
      bag: data,
      isLoadingBag: isPending,
      bagError: error,
      reloadBag: () => {
        refetch();
      },
      addBagItem,
      isAddingBagItem,
      addBagItemError,
      resetAddBagItem,
      deleteBagItem,
      isDeletingBagItem,
      deleteBagItemError,
      resetDeleteBagItem,
      setBagItemChecked,
      isSettingBagItemChecked,
      setBagItemCheckedError,
      resetSetBagItemChecked,
    }),
    [
      data,
      isPending,
      error,
      refetch,
      addBagItem,
      isAddingBagItem,
      addBagItemError,
      resetAddBagItem,
      deleteBagItem,
      isDeletingBagItem,
      deleteBagItemError,
      resetDeleteBagItem,
      setBagItemChecked,
      isSettingBagItemChecked,
      setBagItemCheckedError,
      resetSetBagItemChecked,
    ],
  );
  return <BagContext.Provider value={value}>{children}</BagContext.Provider>;
}

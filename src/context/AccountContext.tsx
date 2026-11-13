import React, { createContext, useMemo } from 'react';
import { UseMutateFunction, useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { AuthResponse } from '../api/types';
import type { ChangePasswordValues } from '../schemas/account';
import { useSession } from '../stores/session';

// « Mon compte » (cahier des charges, 1) : requêtes appelées uniquement par AccountProvider.

/** Nouveau mot de passe : toutes les sessions sont fermées, une nouvelle est renvoyée. */
async function changePasswordRequest(
  values: ChangePasswordValues,
): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>(
    '/api/v1/users/me/password',
    values,
  );
  return data;
}

/** Les données personnelles partent par email, en fichier joint. */
async function requestDataExportRequest(): Promise<void> {
  await apiClient.post('/api/v1/users/me/data-export');
}

/** Compte désactivé tout de suite, données supprimées sous 30 jours. */
async function deleteAccountRequest(password: string): Promise<void> {
  await apiClient.delete('/api/v1/users/me', { data: { password } });
}

export type AccountContextValue = {
  /** En cas de succès, la nouvelle session remplace l'ancienne : ce téléphone reste connecté. */
  changePassword: UseMutateFunction<AuthResponse, Error, ChangePasswordValues>;
  isChangingPassword: boolean;
  changePasswordError: Error | null;
  resetChangePassword: () => void;

  requestDataExport: UseMutateFunction<void, Error, void>;
  isRequestingDataExport: boolean;
  isDataExportSent: boolean;
  dataExportError: Error | null;
  resetDataExport: () => void;

  /** En cas de succès, la session est fermée : retour à l'accueil non connecté. */
  deleteAccount: UseMutateFunction<void, Error, string>;
  isDeletingAccount: boolean;
  deleteAccountError: Error | null;
  resetDeleteAccount: () => void;
};

export const AccountContext = createContext<AccountContextValue | null>(null);

/** Actions de « Mon compte » (via useAccount). */
export function AccountProvider({ children }: { children: React.ReactNode }) {
  const signIn = useSession(state => state.signIn);
  const clearSession = useSession(state => state.clearSession);

  const {
    mutate: changePassword,
    isPending: isChangingPassword,
    error: changePasswordError,
    reset: resetChangePassword,
  } = useMutation({ mutationFn: changePasswordRequest, onSuccess: signIn });

  const {
    mutate: requestDataExport,
    isPending: isRequestingDataExport,
    isSuccess: isDataExportSent,
    error: dataExportError,
    reset: resetDataExport,
  } = useMutation({ mutationFn: requestDataExportRequest });

  const {
    mutate: deleteAccount,
    isPending: isDeletingAccount,
    error: deleteAccountError,
    reset: resetDeleteAccount,
  } = useMutation({
    mutationFn: deleteAccountRequest,
    onSuccess: () => clearSession({ then: 'Bienvenue' }),
  });

  const value = useMemo<AccountContextValue>(
    () => ({
      changePassword,
      isChangingPassword,
      changePasswordError,
      resetChangePassword,
      requestDataExport,
      isRequestingDataExport,
      isDataExportSent,
      dataExportError,
      resetDataExport,
      deleteAccount,
      isDeletingAccount,
      deleteAccountError,
      resetDeleteAccount,
    }),
    [
      changePassword,
      isChangingPassword,
      changePasswordError,
      resetChangePassword,
      requestDataExport,
      isRequestingDataExport,
      isDataExportSent,
      dataExportError,
      resetDataExport,
      deleteAccount,
      isDeletingAccount,
      deleteAccountError,
      resetDeleteAccount,
    ],
  );

  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  );
}

import React, { createContext, useMemo } from 'react';
import { UseMutateFunction, useMutation } from '@tanstack/react-query';
import { useShallow } from 'zustand/react/shallow';
import { apiClient } from '../api/client';
import { refreshSession } from '../api/session';
import type { AuthResponse, User } from '../api/types';
import { loadRefreshToken } from '../lib/tokenStorage';
import type { LoginValues, SignupValues } from '../schemas/auth';
import { AuthEntry, SessionStatus, useSession } from '../stores/session';

// Requêtes HTTP d'authentification, appelées uniquement par AuthProvider.
// Le renouvellement des jetons (refresh) est dans src/api/session.ts : le client HTTP en a besoin.

async function loginRequest(values: LoginValues): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>(
    '/api/v1/auth/login',
    values,
  );
  return data;
}

/** Crée le compte, ouvre la session et envoie l'email de vérification. */
async function signupRequest(values: SignupValues): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>(
    '/api/v1/auth/signup',
    values,
  );
  return data;
}

/** Envoie un nouveau code de vérification (les précédents ne fonctionnent plus). */
async function resendEmailVerificationRequest(): Promise<void> {
  await apiClient.post('/api/v1/auth/email/resend');
}

/** Vérifie le code à 8 chiffres reçu par email ; renvoie l'utilisateur à jour. */
async function verifyEmailRequest(code: string): Promise<User> {
  const { data } = await apiClient.post<User>('/api/v1/auth/email/verify', {
    code,
  });
  return data;
}

async function logoutRequest(refreshToken: string): Promise<void> {
  await apiClient.post('/api/v1/auth/logout', { refreshToken });
}

export type SignOutVariables = { then?: AuthEntry } | void;

/**
 * La session et toutes les actions d'authentification qui appellent le serveur, avec leur
 * état (en cours, erreur, remise à zéro). La session vit dans le store Zustand (lu ici).
 */
export type AuthContextValue = {
  status: SessionStatus;
  user: User | null;
  /** Écran ouvert quand on revient à l'espace non connecté. */
  authEntry: AuthEntry;

  /** Connexion par email : en cas de succès, la session est ouverte. */
  login: UseMutateFunction<AuthResponse, Error, LoginValues>;
  isLoggingIn: boolean;
  loginError: Error | null;
  resetLogin: () => void;

  /** Inscription : en cas de succès, la session est ouverte et l'email de vérification envoyé. */
  signup: UseMutateFunction<AuthResponse, Error, SignupValues>;
  isSigningUp: boolean;
  signupError: Error | null;
  resetSignup: () => void;

  /** Vérifie le code reçu par email ; en cas de succès, l'utilisateur est à jour. */
  verifyEmail: UseMutateFunction<User, Error, string>;
  isVerifyingEmail: boolean;
  verifyEmailError: Error | null;
  resetVerifyEmail: () => void;

  /** Envoie un nouveau code de vérification. */
  resendEmailVerification: UseMutateFunction<void, Error, void>;
  isResendingEmailVerification: boolean;
  isEmailVerificationResent: boolean;
  resendEmailVerificationError: Error | null;
  resetResendEmailVerification: () => void;

  /**
   * Déconnexion : la session est fermée tout de suite, puis le jeton est révoqué côté
   * serveur (sans réseau, il expirera de lui-même). then : écran ouvert ensuite.
   */
  signOut: UseMutateFunction<void, Error, SignOutVariables>;
  isSigningOut: boolean;

  /** Au démarrage (ou « Réessayer ») : reprend la session enregistrée, s'il y en a une. */
  restore: UseMutateFunction<void, Error, void>;
  isRestoring: boolean;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

/** Expose la session et ses actions (via useAuth). Hors React, utiliser useSession.getState(). */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { status, user, authEntry, signIn, setUser, setStatus, clearSession } =
    useSession(
      useShallow(state => ({
        status: state.status,
        user: state.user,
        authEntry: state.authEntry,
        signIn: state.signIn,
        setUser: state.setUser,
        setStatus: state.setStatus,
        clearSession: state.clearSession,
      })),
    );

  const {
    mutate: login,
    isPending: isLoggingIn,
    error: loginError,
    reset: resetLogin,
  } = useMutation({ mutationFn: loginRequest, onSuccess: signIn });

  const {
    mutate: signup,
    isPending: isSigningUp,
    error: signupError,
    reset: resetSignup,
  } = useMutation({ mutationFn: signupRequest, onSuccess: signIn });

  const {
    mutate: verifyEmail,
    isPending: isVerifyingEmail,
    error: verifyEmailError,
    reset: resetVerifyEmail,
  } = useMutation({ mutationFn: verifyEmailRequest, onSuccess: setUser });

  const {
    mutate: resendEmailVerification,
    isPending: isResendingEmailVerification,
    isSuccess: isEmailVerificationResent,
    error: resendEmailVerificationError,
    reset: resetResendEmailVerification,
  } = useMutation({ mutationFn: resendEmailVerificationRequest });

  const { mutate: signOut, isPending: isSigningOut } = useMutation({
    mutationFn: async (options: SignOutVariables) => {
      const refreshToken = await loadRefreshToken();
      await clearSession({ then: options?.then ?? 'Bienvenue' });
      if (refreshToken) {
        // Révocation côté serveur ; sans réseau, le jeton expirera de lui-même.
        await logoutRequest(refreshToken).catch(() => undefined);
      }
    },
  });

  const { mutate: restore, isPending: isRestoring } = useMutation({
    mutationFn: async () => {
      setStatus('restoring');
      if (!(await loadRefreshToken())) {
        await clearSession();
        return;
      }
      const refreshed = await refreshSession();
      if (!refreshed && useSession.getState().status === 'restoring') {
        // Session enregistrée mais serveur injoignable : on pourra réessayer.
        setStatus('unreachable');
      }
    },
  });

  const value: AuthContextValue = {
    status,
    user,
    authEntry,
    login,
    isLoggingIn,
    loginError,
    resetLogin,
    signup,
    isSigningUp,
    signupError,
    resetSignup,
    verifyEmail,
    isVerifyingEmail,
    verifyEmailError,
    resetVerifyEmail,
    resendEmailVerification,
    isResendingEmailVerification,
    isEmailVerificationResent,
    resendEmailVerificationError,
    resetResendEmailVerification,
    signOut,
    isSigningOut,
    restore,
    isRestoring,
  };
  const memoized = useMemo(
    () => value,
    // Les fonctions sont stables : seuls la session et les états changent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    Object.values(value),
  );
  return (
    <AuthContext.Provider value={memoized}>{children}</AuthContext.Provider>
  );
}

import { create } from 'zustand';
import type { AuthResponse, User } from '../api/types';
import { queryClient } from '../lib/queryClient';
import { clearRefreshToken, saveRefreshToken } from '../lib/tokenStorage';

/** Écran ouvert quand on revient à l'espace non connecté. */
export type AuthEntry = 'Bienvenue' | 'Inscription';

/**
 * - restoring : au démarrage, reprise de la session enregistrée ;
 * - unreachable : session enregistrée mais serveur injoignable (on peut réessayer) ;
 * - signedOut / signedIn.
 */
export type SessionStatus =
  | 'restoring'
  | 'unreachable'
  | 'signedOut'
  | 'signedIn';

/**
 * État de la session, sans appel d'API : les actions qui appellent le serveur sont dans
 * AuthContext (connexion, déconnexion, reprise) et src/api/session.ts (renouvellement).
 */
type SessionState = {
  status: SessionStatus;
  user: User | null;
  /** En mémoire uniquement ; le refresh token est dans le trousseau. */
  accessToken: string | null;
  authEntry: AuthEntry;
  /** Ouvre la session avec les jetons reçus (refresh token rangé dans le trousseau). */
  signIn: (auth: AuthResponse) => Promise<void>;
  /** Met à jour l'utilisateur (ex. après vérification de l'email). */
  setUser: (user: User) => void;
  setStatus: (status: SessionStatus) => void;
  /** Ferme la session localement : mémoire, cache des requêtes et trousseau. */
  clearSession: (options?: { then?: AuthEntry }) => Promise<void>;
};

export const useSession = create<SessionState>()(set => ({
  status: 'restoring',
  user: null,
  accessToken: null,
  authEntry: 'Bienvenue',

  signIn: async auth => {
    await saveRefreshToken(auth.refreshToken);
    set({ status: 'signedIn', user: auth.user, accessToken: auth.accessToken });
  },

  setUser: user => set({ user }),

  setStatus: status => set({ status }),

  clearSession: async ({ then } = {}) => {
    set({
      status: 'signedOut',
      user: null,
      accessToken: null,
      ...(then && { authEntry: then }),
    });
    queryClient.clear();
    await clearRefreshToken();
  },
}));

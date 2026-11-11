import { create } from 'zustand';
import { logout, refresh } from '../api/authRequests';
import { ApiError } from '../api/errors';
import type { AuthResponse, User } from '../api/types';
import { queryClient } from '../lib/queryClient';
import {
  clearRefreshToken,
  loadRefreshToken,
  saveRefreshToken,
} from '../lib/tokenStorage';

/**
 * - restoring : au démarrage, reprise de la session enregistrée ;
 * - unreachable : session enregistrée mais serveur injoignable (on peut réessayer) ;
 * - signedOut / signedIn.
 */
export type SessionStatus = 'restoring' | 'unreachable' | 'signedOut' | 'signedIn';

type SessionState = {
  status: SessionStatus;
  user: User | null;
  /** En mémoire uniquement ; le refresh token est dans le trousseau. */
  accessToken: string | null;
  signIn: (auth: AuthResponse) => Promise<void>;
  signOut: () => Promise<void>;
  /** Au démarrage : reprend la session enregistrée, s'il y en a une. */
  restore: () => Promise<void>;
  /** Renouvelle les jetons. Faux si la session n'est plus valide ou si le serveur ne répond pas. */
  refreshSession: () => Promise<boolean>;
};

const signedOut = { status: 'signedOut', user: null, accessToken: null } as const;

export const useSession = create<SessionState>()((set, get) => ({
  status: 'restoring',
  user: null,
  accessToken: null,

  signIn: async auth => {
    await saveRefreshToken(auth.refreshToken);
    set({ status: 'signedIn', user: auth.user, accessToken: auth.accessToken });
  },

  signOut: async () => {
    const refreshToken = await loadRefreshToken();
    set(signedOut);
    queryClient.clear();
    await clearRefreshToken();
    if (refreshToken) {
      // Révocation côté serveur ; sans réseau, le jeton expirera de lui-même.
      logout(refreshToken).catch(() => undefined);
    }
  },

  refreshSession: async () => {
    const refreshToken = await loadRefreshToken();
    if (!refreshToken) {
      set(signedOut);
      return false;
    }
    try {
      await get().signIn(await refresh(refreshToken));
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        // Session expirée ou révoquée : retour à l'écran de connexion.
        await clearRefreshToken();
        set(signedOut);
      }
      return false;
    }
  },

  restore: async () => {
    set({ status: 'restoring' });
    if (!(await loadRefreshToken())) {
      set(signedOut);
      return;
    }
    const refreshed = await get().refreshSession();
    if (!refreshed && get().status === 'restoring') {
      set({ status: 'unreachable' });
    }
  },
}));

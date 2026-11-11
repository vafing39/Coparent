import { useSession } from '../stores/session';
import { loadRefreshToken } from '../lib/tokenStorage';
import { apiClient } from './client';
import { ApiError } from './errors';
import type { AuthResponse } from './types';

/** Échange le refresh token contre une nouvelle paire de jetons (rotation). */
async function refreshRequest(refreshToken: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/api/v1/auth/refresh', {
    refreshToken,
  });
  return data;
}

/**
 * Renouvelle les jetons avec le refresh token du trousseau. Mécanique du client HTTP
 * (rejeu après un 401) et de la reprise de session ; ce n'est pas une action d'écran.
 * Faux si la session n'est plus valide (elle est alors fermée) ou si le serveur ne répond pas.
 */
export async function refreshSession(): Promise<boolean> {
  const session = useSession.getState();
  const refreshToken = await loadRefreshToken();
  if (!refreshToken) {
    await session.clearSession();
    return false;
  }
  try {
    await session.signIn(await refreshRequest(refreshToken));
    return true;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      // Session expirée ou révoquée : retour à l'écran de connexion.
      await session.clearSession();
    }
    return false;
  }
}

import type { AuthResponse } from '../api/types';

/** Réponse d'authentification factice, au format du backend. */
export function authResponse(suffix = '1'): AuthResponse {
  return {
    tokenType: 'Bearer',
    accessToken: `access-${suffix}`,
    accessTokenExpiresAt: '2026-11-11T15:00:00Z',
    refreshToken: `refresh-${suffix}`,
    refreshTokenExpiresAt: '2026-12-11T15:00:00Z',
    user: {
      id: '0c3b6a2e-0000-0000-0000-000000000001',
      email: 'camille@exemple.fr',
      firstName: 'Camille',
      emailVerified: false,
      createdAt: '2026-11-11T14:00:00Z',
    },
  };
}

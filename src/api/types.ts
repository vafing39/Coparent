/**
 * Types des réponses du backend (/api/v1). PROVISOIRE : écrits à la main en
 * attendant leur génération depuis l'OpenAPI du backend.
 */

/** UserResponse côté backend. Dates ISO 8601 en UTC. */
export type User = {
  id: string;
  email: string;
  firstName: string;
  emailVerified: boolean;
  createdAt: string;
};

/** AuthResponse côté backend : réponse de l'inscription, de la connexion et du rafraîchissement. */
export type AuthResponse = {
  tokenType: 'Bearer';
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: User;
};

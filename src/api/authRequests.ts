import type { LoginValues, SignupValues } from '../schemas/auth';
import { apiClient } from './client';
import type { AuthResponse, User } from './types';

export async function login(values: LoginValues): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>(
    '/api/v1/auth/login',
    values,
  );
  return data;
}

/** Crée le compte, ouvre la session et envoie l'email de vérification. */
export async function signup(values: SignupValues): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>(
    '/api/v1/auth/signup',
    values,
  );
  return data;
}

/** Envoie un nouveau code de vérification (les précédents ne fonctionnent plus). */
export async function resendEmailVerification(): Promise<void> {
  await apiClient.post('/api/v1/auth/email/resend');
}

/** Vérifie le code à 8 chiffres reçu par email ; renvoie l'utilisateur à jour. */
export async function verifyEmail(code: string): Promise<User> {
  const { data } = await apiClient.post<User>('/api/v1/auth/email/verify', {
    code,
  });
  return data;
}

/** Échange le refresh token contre une nouvelle paire de jetons (rotation). */
export async function refresh(refreshToken: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/api/v1/auth/refresh', {
    refreshToken,
  });
  return data;
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post('/api/v1/auth/logout', { refreshToken });
}

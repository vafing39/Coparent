import type { LoginValues } from '../schemas/auth';
import { apiClient } from './client';
import type { AuthResponse } from './types';

export async function login(values: LoginValues): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>(
    '/api/v1/auth/login',
    values,
  );
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

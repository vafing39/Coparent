import { apiClient } from './client';
import type { User } from './types';

/** L'utilisateur connecté, tel que le backend le connaît. */
export async function fetchMe(): Promise<User> {
  const { data } = await apiClient.get<User>('/api/v1/users/me');
  return data;
}

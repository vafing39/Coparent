import { useMutation } from '@tanstack/react-query';
import { login } from './authRequests';
import { ApiError } from './errors';

export type { Session } from './authRequests';

export function useLogin() {
  return useMutation({ mutationFn: login });
}

/** Message affiché pour un échec de connexion. Neutre : ne dit pas si le compte existe. */
export function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 400 || error.status === 401) {
      return 'Adresse email ou mot de passe incorrect.';
    }
    if (error.status === 429) {
      return 'Trop de tentatives. Réessayez dans quelques minutes.';
    }
  }
  return 'Connexion impossible pour le moment. Vérifiez votre accès à Internet, puis réessayez.';
}

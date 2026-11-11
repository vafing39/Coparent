import { useMutation } from '@tanstack/react-query';
import { useSession } from '../stores/session';
import { login } from './authRequests';
import { ApiError } from './errors';

/** Connexion par email : en cas de succès, la session est ouverte (bascule vers l'app). */
export function useLogin() {
  const signIn = useSession(state => state.signIn);
  return useMutation({ mutationFn: login, onSuccess: signIn });
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

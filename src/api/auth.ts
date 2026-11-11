import { useMutation } from '@tanstack/react-query';
import { useSession } from '../stores/session';
import {
  login,
  resendEmailVerification,
  signup,
  verifyEmail,
} from './authRequests';
import i18n from '../i18n';
import { ApiError } from './errors';

const networkError = () => i18n.t('errors.network');
const tooManyAttempts = () => i18n.t('errors.tooManyAttempts');

/** Connexion par email : en cas de succès, la session est ouverte (bascule vers l'app). */
export function useLogin() {
  const signIn = useSession(state => state.signIn);
  return useMutation({ mutationFn: login, onSuccess: signIn });
}

/** Message affiché pour un échec de connexion. Neutre : ne dit pas si le compte existe. */
export function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 400 || error.status === 401) {
      return i18n.t('login.errors.invalidCredentials');
    }
    if (error.status === 429) {
      return tooManyAttempts();
    }
  }
  return networkError();
}

/** Inscription : en cas de succès, la session est ouverte et l'email de vérification envoyé. */
export function useSignup() {
  const signIn = useSession(state => state.signIn);
  return useMutation({ mutationFn: signup, onSuccess: signIn });
}

export type SignupError =
  | { field: 'email' | 'password'; message: string }
  | { field: null; message: string };

/**
 * Où et comment afficher un refus d'inscription. Les messages 400 du backend
 * (mot de passe compromis, trop court…) sont neutres et rédigés pour l'utilisateur.
 */
export function signupError(error: unknown): SignupError {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return {
        field: 'email',
        message: i18n.t('signup.errors.emailTaken'),
      };
    }
    if (error.status === 400) {
      return {
        field: 'password',
        message:
          error.message !== 'API error'
            ? error.message
            : i18n.t('signup.errors.passwordRejected'),
      };
    }
    if (error.status === 429) {
      return { field: null, message: tooManyAttempts() };
    }
  }
  return { field: null, message: networkError() };
}

export function useResendEmailVerification() {
  return useMutation({ mutationFn: resendEmailVerification });
}

/** Vérifie le code : en cas de succès, l'utilisateur est à jour et la navigation passe à la suite. */
export function useVerifyEmail() {
  const setUser = useSession(state => state.setUser);
  return useMutation({ mutationFn: verifyEmail, onSuccess: setUser });
}

export const EMAIL_CODE_LENGTH = 8;

/** Message d'échec pour les actions de l'écran de vérification. */
export function verificationErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 400) {
    return i18n.t('onboarding.verification.errors.invalidCode');
  }
  if (error instanceof ApiError && error.status === 429) {
    return tooManyAttempts();
  }
  return networkError();
}

import i18n from '../i18n';
import { ApiError } from './errors';

const networkError = () => i18n.t('errors.network');
const tooManyAttempts = () => i18n.t('errors.tooManyAttempts');

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

export type SignupError =
  | { field: 'email' | 'password'; message: string }
  | { field: null; message: string };

/**
 * Où et comment afficher un refus d'inscription. Les messages 400 du backend
 * (mot de passe compromis, trop court…) sont neutres et rédigés pour l'utilisateur.
 */
export function describeSignupError(error: unknown): SignupError {
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

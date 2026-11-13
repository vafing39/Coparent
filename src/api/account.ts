import i18n from '../i18n';
import { ApiError } from './errors';

/** Où afficher un refus de « Modifier le mot de passe ». */
export type ChangePasswordError =
  | { field: 'currentPassword' | 'newPassword'; message: string }
  | { field: null; message: string };

/**
 * 403 : mot de passe actuel incorrect ; 400 : nouveau mot de passe refusé (message du serveur,
 * neutre et rédigé pour l'utilisateur) ; 429 : trop d'essais.
 */
export function describeChangePasswordError(
  error: unknown,
): ChangePasswordError {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return {
        field: 'currentPassword',
        message: i18n.t('account.password.current.wrong'),
      };
    }
    if (error.status === 400) {
      return {
        field: 'newPassword',
        message:
          error.message !== 'API error'
            ? error.message
            : i18n.t('signup.errors.passwordRejected'),
      };
    }
    if (error.status === 429) {
      return { field: null, message: i18n.t('errors.tooManyAttempts') };
    }
  }
  return { field: null, message: i18n.t('errors.network') };
}

/** Échec de « Supprimer mon compte » : 403 mot de passe incorrect (champ), sinon message général. */
export function describeDeleteAccountError(error: unknown): {
  field: 'password' | null;
  message: string;
} {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return {
        field: 'password',
        message: i18n.t('account.delete.wrongPassword'),
      };
    }
    if (error.status === 429) {
      return { field: null, message: i18n.t('errors.tooManyAttempts') };
    }
  }
  return { field: null, message: i18n.t('errors.network') };
}

/** Échec de « Télécharger mes données » : trois demandes par jour au plus. */
export function dataExportErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 429) {
    return i18n.t('account.data.tooMany');
  }
  return i18n.t('errors.network');
}

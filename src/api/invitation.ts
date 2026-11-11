import i18n from '../i18n';
import { ApiError } from './errors';

export const invitationKeys = {
  preview: (token: string) => ['invitation', token] as const,
};

/** Lien expiré, déjà utilisé ou remplacé par un plus récent. */
export function isInvitationInvalid(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

/**
 * Message d'échec de l'acceptation. Les refus 409 du backend (déjà dans une famille,
 * famille complète, sa propre invitation) sont neutres et rédigés pour l'utilisateur.
 */
export function acceptInvitationErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return i18n.t('invitation.invalid');
    }
    if (error.status === 409) {
      return error.message !== 'API error'
        ? error.message
        : i18n.t('invitation.errors.cannotJoin');
    }
    if (error.status === 403) {
      return i18n.t('onboarding.family.errors.emailNotVerified');
    }
  }
  return i18n.t('errors.network');
}

import i18n from '../i18n';
import { ApiError } from './errors';

export const messageKeys = {
  list: (familyId: string) => ['messages', familyId] as const,
};

/** Message d'échec de l'envoi d'un message. */
export function messageErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return i18n.t('messages.errors.solo');
    }
    if (error.status === 400) {
      return i18n.t('messages.errors.invalid');
    }
  }
  return i18n.t('errors.network');
}

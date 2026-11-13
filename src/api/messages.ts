import i18n from '../i18n';
import { ApiError } from './errors';

export const messageKeys = {
  all: (familyId: string) => ['messages', familyId] as const,
  conversations: (familyId: string) =>
    ['messages', familyId, 'conversations'] as const,
  conversation: (familyId: string, conversationId: string) =>
    ['messages', familyId, 'conversation', conversationId] as const,
};

/** Message d'échec de l'envoi d'un message ou de la création d'une discussion. */
export function messageErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return i18n.t('messages.errors.gone');
    }
    if (error.status === 409) {
      return i18n.t('messages.errors.solo');
    }
    if (error.status === 400) {
      return i18n.t('messages.errors.invalid');
    }
  }
  return i18n.t('errors.network');
}

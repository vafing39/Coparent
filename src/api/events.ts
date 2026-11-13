import i18n from '../i18n';
import { ApiError } from './errors';

export const eventKeys = {
  /** Toutes les listes d'événements de la famille (invalidées après chaque modification). */
  all: (familyId: string) => ['events', familyId] as const,
  range: (familyId: string, from: string, to: string) =>
    ['events', familyId, from, to] as const,
};

/** Message d'échec d'une action sur un événement (enregistrement, suppression). */
export function eventErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return i18n.t('events.errors.gone');
    }
    if (error.status === 400) {
      return i18n.t('events.errors.invalid');
    }
  }
  return i18n.t('errors.network');
}

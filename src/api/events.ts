import i18n from '../i18n';
import { ApiError } from './errors';
import { serverDetail } from './exchanges';

export const eventKeys = {
  /** Toutes les listes d'événements de la famille (invalidées après chaque modification). */
  all: (familyId: string) => ['events', familyId] as const,
  range: (familyId: string, from: string, to: string) =>
    ['events', familyId, from, to] as const,
  /** Aperçu d'une répétition (hors de `all` : rien à recharger après un enregistrement). */
  repeatPreview: (familyId: string, request: unknown) =>
    ['repeatPreview', familyId, request] as const,
};

/** Clé React d'une séance : les séances d'une série partagent le même `id`. */
export function eventItemKey(event: { id: string; date: string }): string {
  return `${event.id}:${event.date}`;
}

/** Message d'échec d'une action sur un événement (enregistrement, suppression). */
export function eventErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return i18n.t('events.errors.gone');
    }
    // Refus précis du serveur sur une série (séance passée, série terminée…)
    const detail = serverDetail(error);
    if (error.status === 409 && detail) {
      return detail;
    }
    if (error.status === 400) {
      return i18n.t('events.errors.invalid');
    }
  }
  return i18n.t('errors.network');
}

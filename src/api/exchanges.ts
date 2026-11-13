import i18n from '../i18n';
import { formatShortDate } from '../lib/dates';
import { ApiError } from './errors';

export const exchangeKeys = {
  all: (familyId: string) => ['exchanges', familyId] as const,
  one: (familyId: string, id: string) => ['exchanges', familyId, id] as const,
};

/** « ven. 20 nov. – dim. 22 nov. », ou « ven. 20 nov. » pour une seule nuit. */
export function exchangePeriod(from: string, to: string): string {
  return from === to
    ? formatShortDate(from)
    : `${formatShortDate(from)} – ${formatShortDate(to)}`;
}

/** Texte du serveur (champ `detail`, en français), absent si l'erreur n'en a pas. */
function serverDetail(error: ApiError): string | null {
  const { message } = error;
  return message &&
    message !== 'API error' &&
    !message.startsWith('Request failed')
    ? message
    : null;
}

/**
 * Message d'échec d'une action sur un échange. Les refus du serveur (400, 409 : nuits qui ne
 * sont pas chez le bon parent, déjà échangées, demande déjà traitée…) ont un texte précis,
 * affiché tel quel.
 */
export function exchangeErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return i18n.t('exchanges.errors.gone');
    }
    const detail = serverDetail(error);
    if ((error.status === 400 || error.status === 409) && detail) {
      return detail;
    }
    if (error.status === 400) {
      return i18n.t('exchanges.errors.invalid');
    }
  }
  return i18n.t('errors.network');
}

import i18n from '../i18n';
import { ApiError } from './errors';
import { serverDetail } from './exchanges';

export const scheduleKeys = {
  one: (familyId: string, id: string) =>
    ['custodySchedules', familyId, id] as const,
};

/**
 * Message d'échec sur un rythme à valider. Les refus du serveur (409 : déjà validé, proposé
 * par vous…) ont un texte précis, affiché tel quel.
 */
export function scheduleProposalErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return i18n.t('scheduleProposal.errors.gone');
    }
    const detail = serverDetail(error);
    if (error.status === 409 && detail) {
      return detail;
    }
  }
  return i18n.t('errors.network');
}

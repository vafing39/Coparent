import i18n from '../i18n';
import { ApiError } from './errors';

export const bagKeys = {
  detail: (familyId: string) => ['bag', familyId] as const,
};

/** Message d'échec d'une action sur le sac (ajout, case, suppression). */
export function bagErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return i18n.t('home.bag.errors.noHandover');
    }
    if (error.status === 404) {
      return i18n.t('home.bag.errors.gone');
    }
    if (error.status === 400) {
      return i18n.t('home.bag.errors.saveFailed');
    }
  }
  return i18n.t('errors.network');
}

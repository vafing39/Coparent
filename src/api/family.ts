import i18n from '../i18n';
import { ApiError } from './errors';

export const familyKeys = {
  mine: ['family', 'me'] as const,
};

/** Message d'échec de l'enregistrement de la famille. */
export function familyErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return i18n.t('onboarding.family.errors.emailNotVerified');
    }
    if (error.status === 409) {
      return i18n.t('onboarding.family.errors.alreadyInFamily');
    }
    if (error.status === 400) {
      return i18n.t('onboarding.family.errors.saveFailed');
    }
  }
  return i18n.t('errors.network');
}

/** Message d'échec de l'enregistrement des enfants. */
export function childrenErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return i18n.t('onboarding.children.errors.saveFailed');
    }
    if (error.status === 403 || error.status === 404) {
      return i18n.t('onboarding.children.errors.familyNotFound');
    }
  }
  return i18n.t('errors.network');
}

/** Message d'échec de l'enregistrement du rythme. */
export function scheduleErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return i18n.t('onboarding.holidays.errors.saveFailed');
    }
    if (error.status === 403 || error.status === 404) {
      return i18n.t('onboarding.children.errors.familyNotFound');
    }
  }
  return i18n.t('errors.network');
}

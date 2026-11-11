import { useContext } from 'react';
import {
  OnboardingDraftContext,
  OnboardingDraftValue,
} from '../context/OnboardingDraftContext';

/** Brouillon de la première connexion (ex. rythme choisi avant les vacances). */
export function useOnboardingDraft(): OnboardingDraftValue {
  const value = useContext(OnboardingDraftContext);
  if (!value) {
    throw new Error(
      'useOnboardingDraft doit être utilisé dans un OnboardingDraftProvider.',
    );
  }
  return value;
}

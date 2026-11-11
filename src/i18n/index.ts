import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { findBestLanguageTag } from 'react-native-localize';
import fr from './locales/fr.json';

/**
 * Textes de l'app. Pour ajouter une langue : créer `locales/<code>.json` avec les mêmes clés,
 * puis l'ajouter à `resources`. La langue du téléphone est choisie si elle est disponible,
 * sinon le français.
 */
export const resources = {
  fr: { translation: fr },
} as const;

export const DEFAULT_LANGUAGE = 'fr';

function deviceLanguage(): string {
  const supported = Object.keys(resources);
  return findBestLanguageTag(supported)?.languageTag ?? DEFAULT_LANGUAGE;
}

// Initialisation synchrone (ressources embarquées) : les textes sont prêts dès le premier rendu.
i18n.use(initReactI18next).init({
  resources,
  lng: deviceLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: { escapeValue: false }, // React échappe déjà le texte
});

export default i18n;

import 'i18next';
import type fr from './locales/fr.json';

// Clés typées : t('cle.inexistante') est une erreur de compilation.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof fr };
  }
}

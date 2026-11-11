import 'react-native-config';

declare module 'react-native-config' {
  export interface NativeConfig {
    /** URL de base du backend (voir .env.example). */
    API_URL?: string;
    /** Domaine des liens https ouverts dans l'app (Universal Links / App Links), ex. coparent.fr. */
    APP_LINKS_DOMAIN?: string;
  }
}

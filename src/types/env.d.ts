import 'react-native-config';

declare module 'react-native-config' {
  export interface NativeConfig {
    /** URL de base du backend (voir .env.example). */
    API_URL?: string;
  }
}

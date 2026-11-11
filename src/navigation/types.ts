import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Bienvenue: undefined;
  Inscription: undefined;
  ConnexionEmail: undefined;
  MotDePasse: undefined;
};

/** Première connexion : étapes avant l'accès à l'app. */
export type OnboardingStackParamList = {
  Verification: undefined;
  Famille: undefined;
  Enfants: undefined;
  Rythme: undefined;
};

/** Espace connecté (provisoire, avant les onglets). */
export type AppStackParamList = {
  Accueil: undefined;
};

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type OnboardingScreenProps<T extends keyof OnboardingStackParamList> =
  NativeStackScreenProps<OnboardingStackParamList, T>;

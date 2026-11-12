import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Bienvenue: undefined;
  Inscription: undefined;
  /** email : adresse saisie avant (mot de passe oublié → retour à la connexion). */
  ConnexionEmail: { email?: string } | undefined;
  /** email : adresse déjà saisie sur l'écran de connexion. */
  MotDePasse: { email?: string } | undefined;
  /** Aperçu d'une invitation reçue par lien (jeton dans InvitationProvider). */
  AccepterInvitation: undefined;
};

/** Première connexion : étapes avant l'accès à l'app. */
export type OnboardingStackParamList = {
  Verification: undefined;
  Famille: undefined;
  Enfants: undefined;
  Rythme: undefined;
  /** Le rythme choisi est dans le brouillon (OnboardingDraftProvider). */
  Vacances: undefined;
  Invitation: undefined;
};

/** Espace connecté : les 5 onglets. */
export type TabsParamList = {
  Accueil: undefined;
  Calendrier: undefined;
  Messages: undefined;
  Famille: undefined;
  Depenses: undefined;
};

/** Espace connecté : les onglets, et les écrans qui s'ouvrent par-dessus. */
export type AppStackParamList = {
  Onglets: NavigatorScreenParams<TabsParamList> | undefined;
  /** Tout ce qui attend une réponse (cahier des charges, 8). */
  ATraiter: undefined;
  /** Sac du prochain passage de garde (lu dans CustodyProvider). */
  SacAPreparer: undefined;
};

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type OnboardingScreenProps<T extends keyof OnboardingStackParamList> =
  NativeStackScreenProps<OnboardingStackParamList, T>;

export type AppScreenProps<T extends keyof AppStackParamList> =
  NativeStackScreenProps<AppStackParamList, T>;

export type TabScreenProps<T extends keyof TabsParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<TabsParamList, T>,
    AppScreenProps<keyof AppStackParamList>
  >;

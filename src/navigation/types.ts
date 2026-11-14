import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CalendarEvent, EventScope } from '../api/types';

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
  /**
   * Nouvel événement (le jour `date` si donné), ou modification de `event`. Pour une séance
   * d'une série, `scope` : les séances modifiées (ONE : celle-ci devient un événement unique).
   */
  EventForm:
    | { event?: CalendarEvent; date?: string; scope?: EventScope }
    | undefined;
  /** Détail d'un événement. */
  EventDetail: { event: CalendarEvent };
  /** Une discussion avec l'autre parent (sujet affiché tout de suite). */
  Conversation: { conversationId: string; subject: string };
  /** Nouvelle discussion : sujet (pré-rempli si donné) et premier message. */
  NewConversation: { subject?: string } | undefined;
  /** Nouvelle demande d'échange de garde. */
  ExchangeForm: undefined;
  /** Une demande d'échange de garde : y répondre ou l'annuler. */
  ExchangeDetail: { exchangeId: string };
  /** Rythme proposé par l'autre parent : le valider ou proposer une modification. */
  ScheduleProposal: { scheduleId: string };
  /** Discussion « Bienvenue » épinglée : un message de Coparent, affiché par l'app. */
  Welcome: undefined;
  /** « Compte et famille », ouvert par la roue dentée de l'accueil. */
  CompteFamille: undefined;
  /** Réglages de ce téléphone : clair, sombre ou automatique. */
  Apparence: undefined;
  /** Réglages de ce téléphone : intervertir les couleurs des parents. */
  CouleursCalendrier: undefined;
  /** Mode solo : inviter l'autre parent (nouveau lien, remplace le précédent). */
  InviterParent: undefined;
  /** « Mon compte » : modifier le mot de passe. */
  ModifierMotDePasse: undefined;
  /** « Mon compte » : recevoir ses données par email. */
  MesDonnees: undefined;
  /** « Mon compte » : supprimer le compte. */
  SupprimerCompte: undefined;
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

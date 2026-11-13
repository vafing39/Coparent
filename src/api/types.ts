import type { VacationZone } from '../schemas/family';

/**
 * Types des réponses du backend (/api/v1). PROVISOIRE : écrits à la main en
 * attendant leur génération depuis l'OpenAPI du backend.
 */

/** UserResponse côté backend. Dates ISO 8601 en UTC. */
export type User = {
  id: string;
  email: string;
  firstName: string;
  emailVerified: boolean;
  createdAt: string;
};

/** AuthResponse côté backend : réponse de l'inscription, de la connexion et du rafraîchissement. */
export type AuthResponse = {
  tokenType: 'Bearer';
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: User;
};

export type FamilyRole = 'PARENT_A' | 'PARENT_B';

/** MemberResponse côté backend. */
export type FamilyMember = {
  userId: string;
  firstName: string;
  role: FamilyRole;
};

/** ChildResponse côté backend. birthDate : date locale « AAAA-MM-JJ ». */
export type Child = {
  id: string;
  firstName: string;
  birthDate: string;
};

export type CustodyPattern =
  | 'ALTERNATE_WEEKS'
  | 'TWO_TWO_THREE'
  | 'TWO_TWO_FIVE_FIVE'
  | 'ALTERNATE_WEEKENDS_WEDNESDAY'
  | 'CUSTOM';

export type SummerSplit = 'FORTNIGHTS' | 'MONTHS';

/** CustodyScheduleRequest côté backend (étape 4). Heure de Paris, « HH:mm ». */
export type CustodyScheduleRequest = {
  pattern: CustodyPattern;
  /** CUSTOM uniquement : une lettre par nuit, A ou B. */
  customSequence?: string;
  /** Première bascule ; son jour de la semaine est le jour de bascule. */
  startDate: string;
  handoverTime: string;
  startingParent: FamilyRole;
  holidayFirstHalfEvenYears: FamilyRole;
  summerSplit: SummerSplit;
};

/** CustodyScheduleResponse côté backend. */
export type CustodySchedule = {
  id: string;
  pattern: CustodyPattern;
  customSequence: string | null;
  startDate: string;
  handoverTime: string;
  startingParent: FamilyRole;
  holidayFirstHalfEvenYears: FamilyRole | null;
  summerSplit: SummerSplit | null;
  status: 'PROPOSED' | 'ACTIVE' | 'REPLACED' | 'REJECTED';
};

/** Étape 5 : lien à partager avec l'autre parent (le jeton n'est renvoyé qu'ici). */
export type Invitation = {
  link: string;
  /** Instant ISO 8601. */
  expiresAt: string;
};

/** Ce que voit l'invité avant d'accepter : rien d'autre n'est partagé (cahier des charges §3). */
export type InvitationPreview = {
  inviterFirstName: string;
  children: { firstName: string; age: number }[];
  custodySchedule: CustodySchedule | null;
  /** Instant ISO 8601. */
  expiresAt: string;
};

/** FamilyResponse côté backend : la famille vue par l'un de ses membres. */
export type Family = {
  id: string;
  name: string;
  vacationZone: VacationZone;
  myRole: FamilyRole;
  /** Un seul parent pour l'instant. */
  solo: boolean;
  members: FamilyMember[];
  children: Child[];
  custodySchedule: CustodySchedule | null;
};

/** Ce qui décide du parent pour une nuit : le rythme habituel, des petites vacances ou l'été. */
export type CustodyPeriod = 'REGULAR' | 'SHORT_HOLIDAY' | 'SUMMER';

/** CustodyNightResponse côté backend : la nuit qui commence le `date` (« AAAA-MM-JJ »). */
export type CustodyNight = {
  date: string;
  parent: FamilyRole;
  period: CustodyPeriod;
  /** Nom officiel des vacances scolaires, null hors vacances. */
  holiday: string | null;
};

/** HandoverResponse côté backend. `at` : date-heure de Paris, sans fuseau (« AAAA-MM-JJTHH:mm:ss »). */
export type Handover = {
  at: string;
  from: FamilyRole;
  to: FamilyRole;
};

/** CustodyResponse côté backend : la garde calculée sur une période. */
export type Custody = {
  /** ACTIVE (validé par les deux parents) ou PROPOSED (en attente, ou mode solo). */
  scheduleStatus: CustodySchedule['status'];
  nights: CustodyNight[];
  handovers: Handover[];
  /** Premier passage après maintenant, même hors période ; null si le rythme n'en prévoit aucun. */
  nextHandover: Handover | null;
};

/** BagItemResponse côté backend. `checkedBy` : prénom de qui a coché, null sinon. */
export type BagItem = {
  id: string;
  label: string;
  checked: boolean;
  checkedBy: string | null;
};

/** BagChildResponse côté backend : les éléments d'un enfant, dans l'ordre d'ajout. */
export type BagChild = {
  childId: string;
  firstName: string;
  items: BagItem[];
};

/**
 * BagResponse côté backend : le sac du prochain passage. `handoverAt` : date-heure de Paris,
 * null sans passage prévu (rien ne peut alors être coché).
 */
export type Bag = {
  handoverAt: string | null;
  checkedCount: number;
  total: number;
  children: BagChild[];
};

/** ToDoKind côté backend : ce qui attend une réponse. */
export type ToDoKind =
  | 'CUSTODY_SCHEDULE'
  | 'EXCHANGE'
  | 'EXPENSE'
  | 'MEMBER'
  | 'DEVICE'
  | 'PUBLICATION_REMOVAL'
  | 'PENSION';

/**
 * ToDoItemResponse côté backend. `requestedBy` : prénom de qui a demandé (null si compte
 * supprimé) ; `assignee` : prénom du parent qui doit répondre. Dates : instants ISO 8601.
 */
export type ToDoItem = {
  id: string;
  kind: ToDoKind;
  subject: string;
  requestedBy: string | null;
  assignee: string;
  requestedAt: string;
  lastNudgedAt: string | null;
};

/** ToDoResponse côté backend : ce qui m'attend (`mine`) et ce qui attend l'autre parent (`theirs`). */
export type ToDo = {
  mine: ToDoItem[];
  theirs: ToDoItem[];
};

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
  /** Qui l'a proposé (null si le compte a été supprimé) ; l'autre parent le valide. */
  proposedById: string | null;
  proposedByFirstName: string | null;
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
  /** Mode solo : le dernier lien envoyé à l'autre parent (le lien lui-même n'est plus lisible). */
  invitation: PendingInvitation | null;
};

/** Lien d'invitation pas encore accepté ni remplacé (mode solo). */
export type PendingInvitation = {
  inviteeFirstName: string;
  /** Instants ISO. */
  sentAt: string;
  expiresAt: string;
  expired: boolean;
};

/** Ce qui décide du parent pour une nuit : le rythme habituel, des petites vacances, l'été ou un échange accepté. */
export type CustodyPeriod = 'REGULAR' | 'SHORT_HOLIDAY' | 'SUMMER' | 'EXCHANGE';

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
  | 'SETTLEMENT'
  | 'MEMBER'
  | 'DEVICE'
  | 'PUBLICATION_REMOVAL'
  | 'PENSION';

/**
 * ToDoItemResponse côté backend. `targetId` : l'objet concerné (ex. l'échange de garde), null
 * sinon ; `requestedBy` : prénom de qui a demandé (null si compte supprimé) ; `assignee` :
 * prénom du parent qui doit répondre. Dates : instants ISO 8601.
 */
export type ToDoItem = {
  id: string;
  kind: ToDoKind;
  targetId: string | null;
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

/** EventType côté backend. */
export type EventType = 'APPOINTMENT' | 'ACTIVITY' | 'SCHOOL' | 'OTHER';

/** EventReminder côté backend (enregistré ; l'envoi viendra avec les notifications). */
export type EventReminder = 'NONE' | 'ONE_HOUR' | 'DAY_BEFORE' | 'TWO_DAYS';

/** EventVisibility côté backend : partagé (les deux parents) ou privé (son auteur seulement). */
export type EventVisibility = 'SHARED' | 'PRIVATE';

/**
 * EventResponse côté backend. `date` (« AAAA-MM-JJ »), `startTime` et `endTime` (« HH:mm:ss »)
 * sont en heure de Paris ; les heures sont null pour une journée entière. `authorFirstName` :
 * null si le compte a été supprimé ; `mine` : j'en suis l'auteur.
 */
export type RepeatFrequency =
  | 'DAILY'
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'CUSTOM';
export type RepeatEnd = 'NEVER' | 'SCHOOL_YEAR' | 'COUNT';
/** Personnalisé : tous les N jours, semaines ou mois. */
export type RepeatUnit = 'DAY' | 'WEEK' | 'MONTH';
/** Personnalisé par mois : le 19, ou le troisième jeudi. */
export type RepeatMonthMode = 'DAY_OF_MONTH' | 'WEEKDAY_OF_MONTH';
export type Weekday =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

/**
 * Un jour d'une répétition personnalisée par semaine. Horaires « HH:mm » quand ils diffèrent
 * d'un jour à l'autre (dans une réponse, « HH:mm:ss » pour chaque jour) ; null partout : même
 * horaire chaque jour.
 */
export type RepeatDay = {
  dayOfWeek: Weekday;
  startTime: string | null;
  endTime: string | null;
};

/** RepeatRequest côté backend : la règle d'un événement répété. */
export type EventRepeat = {
  frequency: RepeatFrequency;
  /** Personnalisé seulement : tous les `interval` `unit` (1 à 12). */
  interval: number | null;
  unit: RepeatUnit | null;
  /** Personnalisé par mois seulement. */
  monthMode: RepeatMonthMode | null;
  /** Personnalisé par semaine seulement : les jours choisis, dont celui de l'événement. */
  days: RepeatDay[];
  /** Seulement quand les enfants sont chez ce parent ; null : peu importe. */
  onlyWith: FamilyRole | null;
  skipHolidays: boolean;
  end: RepeatEnd;
  /** Fin COUNT seulement : nombre de séances. */
  count: number | null;
};

/** Séances concernées par une modification ou une suppression dans une série. */
export type EventScope = 'ONE' | 'FOLLOWING' | 'ALL';

/** Ce qu'une modification a changé. */
export type EventField =
  | 'TITLE'
  | 'TYPE'
  | 'CHILDREN'
  | 'DATE'
  | 'TIME'
  | 'LOCATION'
  | 'REMINDER'
  | 'VISIBILITY'
  | 'REPEAT';

/**
 * EventChangeResponse côté backend : une ligne de l'historique d'un événement et de sa série.
 * `scope` et `occurrenceDate` : séances concernées d'une série ; `authorFirstName` null si le
 * compte a été supprimé ; `mine` : c'est moi.
 */
export type EventChange = {
  id: string;
  action: 'CREATED' | 'UPDATED' | 'DELETED';
  scope: EventScope | null;
  occurrenceDate: string | null;
  fields: EventField[];
  authorFirstName: string | null;
  mine: boolean;
  createdAt: string;
};

/** Une date de l'aperçu d'une répétition ; `skipped` : pourquoi elle n'est pas prévue. */
export type RepeatPreviewDate = {
  date: string;
  /** Chez qui sont les enfants ce soir-là (null sans rythme). */
  parent: FamilyRole | null;
  skipped: 'HOLIDAYS' | 'OTHER_PARENT' | null;
};

export type CalendarEvent = {
  id: string;
  title: string;
  type: EventType;
  children: { id: string; firstName: string }[];
  allDay: boolean;
  date: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  reminder: EventReminder;
  visibility: EventVisibility;
  authorFirstName: string | null;
  mine: boolean;
  /**
   * Événement répété : la règle, la première séance et le dernier jour possible. Chaque séance
   * a le même `id` et sa propre `date`.
   */
  repeat: (EventRepeat & { firstDate: string; until: string | null }) | null;
  createdAt: string;
  updatedAt: string;
};

/** EventRequest côté backend (création ou modification). */
export type EventBody = {
  title: string;
  type: EventType;
  childIds: string[];
  date: string;
  allDay: boolean;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  reminder: EventReminder;
  visibility: EventVisibility;
  /** null : événement unique ; sinon `date` est la première séance. */
  repeat: EventRepeat | null;
};

/** Message entre parents (immuable). `readAt` : lu par le destinataire, sinon null. */
export type Message = {
  id: string;
  conversationId: string;
  /** Ordre dans la famille (toutes discussions confondues). */
  seq: number;
  /** null si le compte de l'expéditeur a été supprimé. */
  senderId: string | null;
  senderFirstName: string | null;
  body: string;
  /** Instant ISO (UTC), fixé par le serveur. */
  createdAt: string;
  readAt: string | null;
};

/** Une page de la conversation, du plus ancien au plus récent. */
export type MessagePage = {
  messages: Message[];
  /** Il existe des messages plus anciens. */
  hasMore: boolean;
};

/** Reçu en temps réel : un nouveau message, ou des messages d'une discussion lus par `readerId` jusqu'à `upToSeq`. */
export type MessageRealtimeEvent =
  | { type: 'MESSAGE'; conversationId: string; message: Message }
  | {
      type: 'READ';
      conversationId: string;
      readerId: string;
      upToSeq: number;
      readAt: string;
    };

/** Discussion sur un sujet avec l'autre parent. Elle a toujours au moins un message. */
export type Conversation = {
  id: string;
  subject: string;
  authorFirstName: string | null;
  createdAt: string;
  lastMessage: Message;
  /** Messages de l'autre parent que je n'ai pas encore lus. */
  unreadCount: number;
};

/** Nouvelle discussion : sujet et premier message. */
export type CreateConversationBody = { subject: string; body: string };

/** ExchangeStatus côté backend. */
export type ExchangeStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';

/**
 * ExchangeResponse côté backend : une demande d'échange de garde. Le demandeur prend les nuits
 * `takeFrom`..`takeTo` (« AAAA-MM-JJ », incluses) et laisse en option `giveFrom`..`giveTo`.
 * `mine` : c'est ma demande (je peux l'annuler), sinon j'y réponds.
 */
export type Exchange = {
  id: string;
  status: ExchangeStatus;
  requesterRole: FamilyRole;
  requestedByFirstName: string | null;
  mine: boolean;
  takeFrom: string;
  takeTo: string;
  giveFrom: string | null;
  giveTo: string | null;
  message: string | null;
  createdAt: string;
  answeredAt: string | null;
};

/** ExchangeRequest côté backend. */
export type ExchangeBody = {
  takeFrom: string;
  takeTo: string;
  giveFrom?: string;
  giveTo?: string;
  message?: string;
};

export type ExpenseStatus = 'PENDING' | 'CONTESTED' | 'VALIDATED' | 'WITHDRAWN';

export type ExpenseCategory =
  | 'HEALTH'
  | 'SCHOOL'
  | 'CANTEEN'
  | 'ACTIVITIES'
  | 'CLOTHING'
  | 'OTHER';

export type ContestReason = 'AMOUNT' | 'RECEIPT' | 'NOT_AGREED' | 'OTHER';

/**
 * ExpenseResponse côté backend. Montants en centimes ; `payerSharePercent` : part du payeur ;
 * `owedCents` : ce que l'autre parent doit au payeur (calculé par le serveur). `mine` : j'en suis
 * l'auteur ; `canAnswer` : je peux l'accepter ou la contester ; `canEdit` : la corriger ou la
 * retirer. `paidOn` : « AAAA-MM-JJ ».
 */
export type Expense = {
  id: string;
  status: ExpenseStatus;
  label: string;
  amountCents: number;
  category: ExpenseCategory;
  children: { id: string; firstName: string }[];
  payerRole: FamilyRole;
  paidOn: string;
  payerSharePercent: number;
  owedCents: number;
  authorRole: FamilyRole;
  authorFirstName: string | null;
  mine: boolean;
  canAnswer: boolean;
  canEdit: boolean;
  contestReason: ContestReason | null;
  contestNote: string | null;
  /** Date du justificatif photo, null sans justificatif (sert aussi à rafraîchir l'image). */
  receiptUpdatedAt: string | null;
  createdAt: string;
  answeredAt: string | null;
};

/** ExpenseRequest côté backend : nouvelle dépense ou correction. */
export type ExpenseBody = {
  label: string;
  amountCents: number;
  category: ExpenseCategory;
  payerRole: FamilyRole;
  paidOn: string;
  payerSharePercent: number;
  childIds: string[];
};

export type SettlementStatus =
  | 'DECLARED'
  | 'NOT_RECEIVED'
  | 'CONFIRMED'
  | 'CANCELLED';

/** SettlementResponse côté backend. `mine` : je l'ai déclaré ; sinon je confirme sa réception. */
export type Settlement = {
  id: string;
  payerRole: FamilyRole;
  amountCents: number;
  status: SettlementStatus;
  mine: boolean;
  declaredAt: string;
  answeredAt: string | null;
};

/**
 * Une ligne du solde : une dépense validée ou un virement confirmé (`label` et
 * `payerSharePercent` null). `owedCents` : ce que la ligne déplace dans le solde.
 */
export type BalanceLine = {
  kind: 'EXPENSE' | 'SETTLEMENT';
  id: string;
  label: string | null;
  amountCents: number;
  payerRole: FamilyRole;
  payerSharePercent: number | null;
  owedCents: number;
  date: string;
};

/**
 * BalanceResponse côté backend : `debtorRole` doit `amountCents` à l'autre parent (null et 0 :
 * rien à régler). `openSettlement` : le virement qui attend une confirmation.
 */
export type Balance = {
  debtorRole: FamilyRole | null;
  amountCents: number;
  lines: BalanceLine[];
  openSettlement: Settlement | null;
};

/** Catégorie d'un document : École, Assurance, Identité, Jugement, Autre. */
export type DocumentCategory =
  | 'SCHOOL'
  | 'INSURANCE'
  | 'IDENTITY'
  | 'JUDGMENT'
  | 'OTHER';

/** Une ligne de l'historique d'un document : une ouverture, ou sa suppression. */
export type DocumentHistoryLine = {
  kind: 'VIEWED' | 'DELETED';
  role: FamilyRole;
  /** Null si le compte a été supprimé. */
  firstName: string | null;
  at: string;
};

/** DocumentResponse côté backend. `childId` null : tous les enfants. */
export type FamilyDocument = {
  id: string;
  title: string;
  category: DocumentCategory;
  childId: string | null;
  childFirstName: string | null;
  contentType: string;
  sizeBytes: number;
  authorRole: FamilyRole;
  authorFirstName: string | null;
  canDelete: boolean;
  createdAt: string;
  /** Supprimé par son auteur : plus de fichier, l'historique reste. */
  deletedAt: string | null;
  deletedByRole: FamilyRole | null;
  /** La plus récente d'abord. */
  history: DocumentHistoryLine[];
};

/** Lien temporaire vers le fichier d'un document (quelques minutes). */
/** Lien temporaire : chemin relatif (`/api/v1/document-files/{jeton}`), à préfixer par `API_URL`. */
export type DocumentLink = { path: string; expiresAt: string };

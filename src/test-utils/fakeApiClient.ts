import { ApiError } from '../api/errors';
import type {
  AuthResponse,
  Bag,
  CalendarEvent,
  EventBody,
  Exchange,
  ExchangeBody,
  Conversation,
  CreateConversationBody,
  Message,
  MessagePage,
  ToDo,
  Child,
  Custody,
  CustodySchedule,
  CustodyScheduleRequest,
  Family,
  Invitation,
  InvitationPreview,
  User,
} from '../api/types';
import type {
  LoginValues,
  ResetPasswordValues,
  SignupValues,
} from '../schemas/auth';
import type { AddBagItemVariables } from '../context/BagContext';
import type { ChildPayload } from '../context/FamilyContext';

type FamilyBody = { name: string; vacationZone: string };

/**
 * Une fonction simulée par route de la famille, appelée avec les paramètres de l'URL
 * puis le corps envoyé. fetchMyFamily → null simule le 404 « pas encore de famille ».
 */
export const familyApi = {
  fetchMyFamily: jest.fn<Promise<Family | null>, []>(),
  createFamily: jest.fn<Promise<Family>, [FamilyBody]>(),
  updateFamily: jest.fn<Promise<Family>, [string, FamilyBody]>(),
  addChild: jest.fn<Promise<Child>, [string, ChildPayload]>(),
  updateChild: jest.fn<Promise<Child>, [string, string, ChildPayload]>(),
  deleteChild: jest.fn<Promise<void>, [string, string]>(),
  createInvitation: jest.fn<Promise<Invitation>, [string, string]>(),
  proposeSchedule: jest.fn<
    Promise<CustodySchedule>,
    [string, CustodyScheduleRequest]
  >(),
  /** Paramètres : familyId, from, to. */
  custody: jest.fn<Promise<Custody>, [string, string, string]>(),
};

/** Sac vide, renvoyé par GET …/bag tant qu'un test ne simule pas cette route. */
export const EMPTY_BAG: Bag = {
  handoverAt: null,
  checkedCount: 0,
  total: 0,
  children: [],
};

/** Une fonction simulée par route du sac à préparer (familyId, puis itemId ou corps). */
export const bagApi = {
  get: jest.fn<Promise<Bag>, [string]>(),
  addItem: jest.fn<Promise<Bag>, [string, AddBagItemVariables]>(),
  deleteItem: jest.fn<Promise<Bag>, [string, string]>(),
  check: jest.fn<Promise<Bag>, [string, string]>(),
  uncheck: jest.fn<Promise<Bag>, [string, string]>(),
};

/** « À traiter » vide, renvoyé par GET …/to-do tant qu'un test ne simule pas cette route. */
export const EMPTY_TO_DO: ToDo = { mine: [], theirs: [] };

/** « À traiter » : une fonction simulée par route (familyId, puis id de la demande). */
export const toDoApi = {
  get: jest.fn<Promise<ToDo>, [string]>(),
  nudge: jest.fn<Promise<ToDo>, [string, string]>(),
};

/**
 * Événements : une fonction simulée par route (familyId, puis période, id ou corps). La liste
 * renvoie [] tant qu'un test ne la simule pas.
 */
export const eventApi = {
  list: jest.fn<Promise<CalendarEvent[]>, [string, string, string]>(),
  create: jest.fn<Promise<CalendarEvent>, [string, EventBody]>(),
  update: jest.fn<Promise<CalendarEvent>, [string, string, EventBody]>(),
  remove: jest.fn<Promise<void>, [string, string]>(),
};

/**
 * Échanges de garde : une demande (familyId, exchangeId), création (familyId, corps), réponse
 * (familyId, exchangeId, 'accept' | 'decline' | 'cancel').
 */
export const exchangeApi = {
  get: jest.fn<Promise<Exchange>, [string, string]>(),
  create: jest.fn<Promise<Exchange>, [string, ExchangeBody]>(),
  answer: jest.fn<Promise<Exchange>, [string, string, string]>(),
};

/** Rythme à valider. Paramètres : (familyId, scheduleId). */
export const scheduleApi = {
  get: jest.fn<Promise<CustodySchedule>, [string, string]>(),
  accept: jest.fn<Promise<CustodySchedule>, [string, string]>(),
};

/**
 * Messagerie par discussions : liste des discussions (familyId ; [] tant qu'un test ne la simule
 * pas), création (familyId, corps), messages d'une discussion (familyId, conversationId, before ;
 * vide par défaut), envoi (familyId, conversationId, texte), lecture (familyId, conversationId, upToSeq).
 */
export const messageApi = {
  conversations: jest.fn<Promise<Conversation[]>, [string]>(),
  createConversation: jest.fn<
    Promise<Conversation>,
    [string, CreateConversationBody]
  >(),
  list: jest.fn<Promise<MessagePage>, [string, string, number | undefined]>(),
  send: jest.fn<Promise<Message>, [string, string, string]>(),
  read: jest.fn<Promise<void>, [string, string, number]>(),
};

/** Une fonction simulée par route d'authentification (paramètres utiles du corps). */
export const authApi = {
  login: jest.fn<Promise<AuthResponse>, [LoginValues]>(),
  signup: jest.fn<Promise<AuthResponse>, [SignupValues]>(),
  verifyEmail: jest.fn<Promise<User>, [string]>(),
  resendEmailVerification: jest.fn<Promise<void>, []>(),
  refresh: jest.fn<Promise<AuthResponse>, [string]>(),
  logout: jest.fn<Promise<void>, [string]>(),
  forgotPassword: jest.fn<Promise<void>, [string]>(),
  resetPassword: jest.fn<Promise<void>, [ResetPasswordValues]>(),
};

/** Invitation côté invité : aperçu public (null simule le 404 « plus valide ») et acceptation. */
export const invitationApi = {
  preview: jest.fn<Promise<InvitationPreview | null>, [string]>(),
  accept: jest.fn<Promise<Family>, [string]>(),
};

const INVITATION_PREVIEW = /^\/api\/v1\/invitations\/([^/]+)$/;
const INVITATION_ACCEPT = /^\/api\/v1\/invitations\/([^/]+)\/accept$/;

const FAMILY = /^\/api\/v1\/families\/([^/]+)$/;
const CHILDREN = /^\/api\/v1\/families\/([^/]+)\/children$/;
const CHILD = /^\/api\/v1\/families\/([^/]+)\/children\/([^/]+)$/;
const INVITATIONS = /^\/api\/v1\/families\/([^/]+)\/invitations$/;
const SCHEDULE = /^\/api\/v1\/families\/([^/]+)\/custody-schedule$/;
const SCHEDULE_ONE =
  /^\/api\/v1\/families\/([^/]+)\/custody-schedules\/([^/]+)$/;
const SCHEDULE_ACCEPT =
  /^\/api\/v1\/families\/([^/]+)\/custody-schedules\/([^/]+)\/accept$/;
const BAG = /^\/api\/v1\/families\/([^/]+)\/bag$/;
const BAG_ITEMS = /^\/api\/v1\/families\/([^/]+)\/bag\/items$/;
const BAG_ITEM = /^\/api\/v1\/families\/([^/]+)\/bag\/items\/([^/]+)$/;
const BAG_CHECK = /^\/api\/v1\/families\/([^/]+)\/bag\/items\/([^/]+)\/check$/;
const TO_DO = /^\/api\/v1\/families\/([^/]+)\/to-do$/;
const TO_DO_NUDGE = /^\/api\/v1\/families\/([^/]+)\/to-do\/([^/]+)\/nudge$/;
const CUSTODY =
  /^\/api\/v1\/families\/([^/]+)\/custody\?from=([\d-]+)&to=([\d-]+)$/;
const EVENTS_RANGE =
  /^\/api\/v1\/families\/([^/]+)\/events\?from=([\d-]+)&to=([\d-]+)$/;
const EVENTS = /^\/api\/v1\/families\/([^/]+)\/events$/;
const EXCHANGES = /^\/api\/v1\/families\/([^/]+)\/exchanges$/;
const EXCHANGE = /^\/api\/v1\/families\/([^/]+)\/exchanges\/([^/]+)$/;
const EXCHANGE_ANSWER =
  /^\/api\/v1\/families\/([^/]+)\/exchanges\/([^/]+)\/(accept|decline|cancel)$/;
const EVENT = /^\/api\/v1\/families\/([^/]+)\/events\/([^/?]+)$/;
const CONVERSATIONS = /^\/api\/v1\/families\/([^/]+)\/conversations$/;
const CONVERSATION_MESSAGES =
  /^\/api\/v1\/families\/([^/]+)\/conversations\/([^/]+)\/messages(?:\?before=(\d+))?$/;
const CONVERSATION_READ =
  /^\/api\/v1\/families\/([^/]+)\/conversations\/([^/]+)\/read$/;

function authRoute(url: string, body: unknown) {
  const { refreshToken, code, email } = (body ?? {}) as {
    refreshToken?: string;
    code?: string;
    email?: string;
  };
  switch (url) {
    case '/api/v1/auth/login':
      return authApi.login(body as LoginValues);
    case '/api/v1/auth/signup':
      return authApi.signup(body as SignupValues);
    case '/api/v1/auth/email/verify':
      return authApi.verifyEmail(code as string);
    case '/api/v1/auth/email/resend':
      return authApi.resendEmailVerification();
    case '/api/v1/auth/refresh':
      return authApi.refresh(refreshToken as string);
    case '/api/v1/auth/logout':
      return authApi.logout(refreshToken as string);
    case '/api/v1/auth/password/forgot':
      return authApi.forgotPassword(email as string);
    case '/api/v1/auth/password/reset':
      return authApi.resetPassword(body as ResetPasswordValues);
  }
  return undefined;
}

async function route(method: string, url: string, body?: unknown) {
  let match: RegExpMatchArray | null;
  if (method === 'POST' && url.startsWith('/api/v1/auth/')) {
    const response = authRoute(url, body);
    if (response) {
      return response;
    }
  }
  if (method === 'GET' && (match = url.match(INVITATION_PREVIEW))) {
    const preview = await invitationApi.preview(decodeURIComponent(match[1]));
    if (preview === null) {
      throw new ApiError(404);
    }
    return preview;
  }
  if (method === 'POST' && (match = url.match(INVITATION_ACCEPT))) {
    return invitationApi.accept(decodeURIComponent(match[1]));
  }
  if (method === 'GET' && url === '/api/v1/families/me') {
    const found = await familyApi.fetchMyFamily();
    if (found === null) {
      throw new ApiError(404);
    }
    return found;
  }
  if (method === 'POST' && url === '/api/v1/families') {
    return familyApi.createFamily(body as FamilyBody);
  }
  if (method === 'PUT' && (match = url.match(FAMILY))) {
    return familyApi.updateFamily(match[1], body as FamilyBody);
  }
  if (method === 'POST' && (match = url.match(CHILDREN))) {
    return familyApi.addChild(match[1], body as ChildPayload);
  }
  if (method === 'PUT' && (match = url.match(CHILD))) {
    return familyApi.updateChild(match[1], match[2], body as ChildPayload);
  }
  if (method === 'DELETE' && (match = url.match(CHILD))) {
    return familyApi.deleteChild(match[1], match[2]);
  }
  if (method === 'POST' && (match = url.match(INVITATIONS))) {
    const { inviteeFirstName } = body as { inviteeFirstName: string };
    return familyApi.createInvitation(match[1], inviteeFirstName);
  }
  if (method === 'PUT' && (match = url.match(SCHEDULE))) {
    return familyApi.proposeSchedule(match[1], body as CustodyScheduleRequest);
  }
  if (method === 'GET' && (match = url.match(SCHEDULE_ONE))) {
    return scheduleApi.get(match[1], match[2]);
  }
  if (method === 'POST' && (match = url.match(SCHEDULE_ACCEPT))) {
    return scheduleApi.accept(match[1], match[2]);
  }
  if (method === 'GET' && (match = url.match(CUSTODY))) {
    return familyApi.custody(match[1], match[2], match[3]);
  }
  if (method === 'GET' && (match = url.match(TO_DO))) {
    return (await toDoApi.get(match[1])) ?? EMPTY_TO_DO;
  }
  if (method === 'POST' && (match = url.match(TO_DO_NUDGE))) {
    return toDoApi.nudge(match[1], match[2]);
  }
  if (method === 'GET' && (match = url.match(BAG))) {
    return (await bagApi.get(match[1])) ?? EMPTY_BAG;
  }
  if (method === 'POST' && (match = url.match(BAG_ITEMS))) {
    return bagApi.addItem(match[1], body as AddBagItemVariables);
  }
  if (method === 'DELETE' && (match = url.match(BAG_ITEM))) {
    return bagApi.deleteItem(match[1], match[2]);
  }
  if (method === 'PUT' && (match = url.match(BAG_CHECK))) {
    return bagApi.check(match[1], match[2]);
  }
  if (method === 'DELETE' && (match = url.match(BAG_CHECK))) {
    return bagApi.uncheck(match[1], match[2]);
  }
  if (method === 'GET' && (match = url.match(EVENTS_RANGE))) {
    return (await eventApi.list(match[1], match[2], match[3])) ?? [];
  }
  if (method === 'POST' && (match = url.match(EVENTS))) {
    return eventApi.create(match[1], body as EventBody);
  }
  if (method === 'PUT' && (match = url.match(EVENT))) {
    return eventApi.update(match[1], match[2], body as EventBody);
  }
  if (method === 'DELETE' && (match = url.match(EVENT))) {
    return eventApi.remove(match[1], match[2]);
  }
  if (method === 'GET' && (match = url.match(CONVERSATIONS))) {
    return (await messageApi.conversations(match[1])) ?? [];
  }
  if (method === 'POST' && (match = url.match(CONVERSATIONS))) {
    return messageApi.createConversation(
      match[1],
      body as CreateConversationBody,
    );
  }
  if (method === 'GET' && (match = url.match(CONVERSATION_MESSAGES))) {
    const before = match[3] === undefined ? undefined : Number(match[3]);
    return (
      (await messageApi.list(match[1], match[2], before)) ?? {
        messages: [],
        hasMore: false,
      }
    );
  }
  if (method === 'POST' && (match = url.match(CONVERSATION_MESSAGES))) {
    return messageApi.send(match[1], match[2], (body as { body: string }).body);
  }
  if (method === 'POST' && (match = url.match(CONVERSATION_READ))) {
    return messageApi.read(
      match[1],
      match[2],
      (body as { upToSeq: number }).upToSeq,
    );
  }
  if (method === 'GET' && (match = url.match(EXCHANGE))) {
    return exchangeApi.get(match[1], match[2]);
  }
  if (method === 'POST' && (match = url.match(EXCHANGES))) {
    return exchangeApi.create(match[1], body as ExchangeBody);
  }
  if (method === 'POST' && (match = url.match(EXCHANGE_ANSWER))) {
    return exchangeApi.answer(match[1], match[2], match[3]);
  }
  throw new Error(`Requête non simulée : ${method} ${url}`);
}

const respond = async (method: string, url: string, body?: unknown) => ({
  data: await route(method, url, body),
});

/**
 * Remplace le client HTTP dans les tests :
 * jest.mock('<chemin>/api/client', () => jest.requireActual('<chemin>/test-utils/fakeApiClient'))
 */
export const apiClient = {
  get: (url: string) => respond('GET', url),
  post: (url: string, body?: unknown) => respond('POST', url, body),
  put: (url: string, body?: unknown) => respond('PUT', url, body),
  delete: (url: string) => respond('DELETE', url),
};

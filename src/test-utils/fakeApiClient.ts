import { ApiError } from '../api/errors';
import type {
  AuthResponse,
  Child,
  CustodySchedule,
  CustodyScheduleRequest,
  Family,
  User,
} from '../api/types';
import type { LoginValues, SignupValues } from '../schemas/auth';
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
  proposeSchedule: jest.fn<
    Promise<CustodySchedule>,
    [string, CustodyScheduleRequest]
  >(),
};

/** Une fonction simulée par route d'authentification (paramètres utiles du corps). */
export const authApi = {
  login: jest.fn<Promise<AuthResponse>, [LoginValues]>(),
  signup: jest.fn<Promise<AuthResponse>, [SignupValues]>(),
  verifyEmail: jest.fn<Promise<User>, [string]>(),
  resendEmailVerification: jest.fn<Promise<void>, []>(),
  refresh: jest.fn<Promise<AuthResponse>, [string]>(),
  logout: jest.fn<Promise<void>, [string]>(),
};

const FAMILY = /^\/api\/v1\/families\/([^/]+)$/;
const CHILDREN = /^\/api\/v1\/families\/([^/]+)\/children$/;
const CHILD = /^\/api\/v1\/families\/([^/]+)\/children\/([^/]+)$/;
const SCHEDULE = /^\/api\/v1\/families\/([^/]+)\/custody-schedule$/;

function authRoute(url: string, body: unknown) {
  const { refreshToken, code } = (body ?? {}) as {
    refreshToken?: string;
    code?: string;
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
  if (method === 'PUT' && (match = url.match(SCHEDULE))) {
    return familyApi.proposeSchedule(match[1], body as CustodyScheduleRequest);
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

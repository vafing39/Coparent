import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import * as Keychain from 'react-native-keychain';
import { useSession } from '../../stores/session';
import { saveRefreshToken } from '../../lib/tokenStorage';
import { authResponse } from '../../test-utils/authFixtures';
import { apiClient } from '../client';
import { ApiError } from '../errors';

type Handler = (config: InternalAxiosRequestConfig) => [number, unknown];

/** Remplace le transport HTTP : chaque requête passe par handler. */
function mockServer(handler: Handler) {
  const adapter = jest.fn<ReturnType<AxiosAdapter>, [InternalAxiosRequestConfig]>(
    async config => {
      const [status, data] = handler(config);
      const response = { status, data, headers: {}, config, statusText: '' } as AxiosResponse;
      if (status >= 400) {
        const error = Object.assign(new Error(`HTTP ${status}`), {
          isAxiosError: true,
          response,
          config,
        });
        throw error;
      }
      return response;
    },
  );
  apiClient.defaults.adapter = adapter;
  return adapter;
}

beforeEach(() => {
  (Keychain as unknown as { __reset: () => void }).__reset();
  useSession.setState({ status: 'signedIn', user: authResponse().user, accessToken: 'access-old' });
});

test('ajoute le jeton d’accès aux requêtes', async () => {
  const adapter = mockServer(() => [200, { ok: true }]);
  await apiClient.get('/api/v1/users/me');
  expect(adapter.mock.calls[0][0].headers.Authorization).toBe('Bearer access-old');
});

test('401 : rafraîchit la session puis rejoue la requête', async () => {
  await saveRefreshToken('refresh-old');
  const adapter = mockServer(config => {
    if (config.url === '/api/v1/auth/refresh') {
      return [200, authResponse('new')];
    }
    return config.headers.Authorization === 'Bearer access-new' ? [200, { ok: true }] : [401, {}];
  });

  const response = await apiClient.get('/api/v1/users/me');

  expect(response.data).toEqual({ ok: true });
  expect(useSession.getState().accessToken).toBe('access-new');
  expect(adapter).toHaveBeenCalledTimes(3); // requête, rafraîchissement, nouvelle tentative
});

test('401 simultanés : un seul rafraîchissement', async () => {
  await saveRefreshToken('refresh-old');
  const adapter = mockServer(config => {
    if (config.url === '/api/v1/auth/refresh') {
      return [200, authResponse('new')];
    }
    return config.headers.Authorization === 'Bearer access-new' ? [200, {}] : [401, {}];
  });

  await Promise.all([apiClient.get('/a'), apiClient.get('/b'), apiClient.get('/c')]);

  const refreshCalls = adapter.mock.calls.filter(([c]) => c.url === '/api/v1/auth/refresh');
  expect(refreshCalls).toHaveLength(1);
});

test('rafraîchissement refusé : déconnexion et ApiError 401', async () => {
  await saveRefreshToken('refresh-revoked');
  mockServer(() => [401, { detail: 'Session expirée.' }]);

  const error = await apiClient.get('/api/v1/users/me').catch(e => e);
  expect(error).toBeInstanceOf(ApiError);
  expect(error.status).toBe(401);
  expect(useSession.getState().status).toBe('signedOut');
  expect(useSession.getState().accessToken).toBeNull();
});

test('pas de réponse du serveur : ApiError sans statut', async () => {
  apiClient.defaults.adapter = async () => {
    throw Object.assign(new Error('Network Error'), { isAxiosError: true });
  };
  const error = await apiClient.get('/x').catch(e => e);
  expect(error).toBeInstanceOf(ApiError);
  expect(error.status).toBeNull();
});

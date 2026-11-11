import * as Keychain from 'react-native-keychain';
import { logout, refresh } from '../../api/authRequests';
import { ApiError } from '../../api/errors';
import { loadRefreshToken, saveRefreshToken } from '../../lib/tokenStorage';
import { authResponse } from '../../test-utils/authFixtures';
import { useSession } from '../session';

jest.mock('../../api/authRequests', () => ({
  login: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
}));

const mockedRefresh = refresh as jest.MockedFunction<typeof refresh>;
const mockedLogout = logout as jest.MockedFunction<typeof logout>;

beforeEach(() => {
  (Keychain as unknown as { __reset: () => void }).__reset();
  jest.clearAllMocks();
  mockedLogout.mockResolvedValue();
  useSession.setState({ status: 'restoring', user: null, accessToken: null });
});

test('signIn : session ouverte, refresh token dans le trousseau', async () => {
  await useSession.getState().signIn(authResponse());
  expect(useSession.getState()).toMatchObject({
    status: 'signedIn',
    accessToken: 'access-1',
    user: { firstName: 'Camille' },
  });
  expect(await loadRefreshToken()).toBe('refresh-1');
});

test('signOut : trousseau vidé et jeton révoqué côté serveur', async () => {
  await useSession.getState().signIn(authResponse());
  await useSession.getState().signOut();
  expect(useSession.getState().status).toBe('signedOut');
  expect(await loadRefreshToken()).toBeNull();
  expect(mockedLogout).toHaveBeenCalledWith('refresh-1');
});

test('restore sans session enregistrée : déconnecté, sans appel serveur', async () => {
  await useSession.getState().restore();
  expect(useSession.getState().status).toBe('signedOut');
  expect(mockedRefresh).not.toHaveBeenCalled();
});

test('restore avec session valide : reconnecté avec de nouveaux jetons', async () => {
  await saveRefreshToken('refresh-old');
  mockedRefresh.mockResolvedValue(authResponse('new'));
  await useSession.getState().restore();
  expect(useSession.getState()).toMatchObject({ status: 'signedIn', accessToken: 'access-new' });
  expect(await loadRefreshToken()).toBe('refresh-new');
});

test('restore avec session expirée : déconnecté, trousseau vidé', async () => {
  await saveRefreshToken('refresh-old');
  mockedRefresh.mockRejectedValue(new ApiError(401));
  await useSession.getState().restore();
  expect(useSession.getState().status).toBe('signedOut');
  expect(await loadRefreshToken()).toBeNull();
});

test('restore serveur injoignable : état « unreachable », session conservée', async () => {
  await saveRefreshToken('refresh-old');
  mockedRefresh.mockRejectedValue(new ApiError(null));
  await useSession.getState().restore();
  expect(useSession.getState().status).toBe('unreachable');
  expect(await loadRefreshToken()).toBe('refresh-old');
});

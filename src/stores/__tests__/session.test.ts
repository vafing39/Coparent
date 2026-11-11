import * as Keychain from 'react-native-keychain';
import { loadRefreshToken } from '../../lib/tokenStorage';
import { authResponse } from '../../test-utils/authFixtures';
import { useSession } from '../session';

beforeEach(() => {
  (Keychain as unknown as { __reset: () => void }).__reset();
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

test('clearSession : session fermée, trousseau vidé, écran de retour choisi', async () => {
  await useSession.getState().signIn(authResponse());
  await useSession.getState().clearSession({ then: 'Inscription' });
  expect(useSession.getState()).toMatchObject({
    status: 'signedOut',
    user: null,
    accessToken: null,
    authEntry: 'Inscription',
  });
  expect(await loadRefreshToken()).toBeNull();
});

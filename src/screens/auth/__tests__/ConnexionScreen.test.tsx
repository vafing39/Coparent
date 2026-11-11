import React from 'react';
import { Pressable, Text } from 'react-native';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { ConnexionScreen } from '../ConnexionScreen';
import { loginErrorMessage } from '../../../api/auth';
import { ApiError } from '../../../api/errors';
import { useSession } from '../../../stores/session';
import { authResponse } from '../../../test-utils/authFixtures';
import { authApi } from '../../../test-utils/fakeApiClient';
import { renderWithProviders } from '../../../test-utils/render';

jest.mock('../../../api/client', () =>
  jest.requireActual('../../../test-utils/fakeApiClient'),
);

const mockedLogin = authApi.login;
const navigate = jest.fn();

const props = {
  navigation: { navigate },
  route: { key: 'ConnexionEmail', name: 'ConnexionEmail' },
} as unknown as React.ComponentProps<typeof ConnexionScreen>;

async function renderScreen() {
  await renderWithProviders(<ConnexionScreen {...props} />);
}

async function fill(email: string, password: string) {
  await fireEvent.changeText(screen.getByLabelText('Adresse email'), email);
  await fireEvent.changeText(screen.getByLabelText('Mot de passe'), password);
}

async function submit() {
  await fireEvent.press(screen.getByRole('button', { name: 'Se connecter' }));
}

beforeEach(() => {
  navigate.mockClear();
  mockedLogin.mockReset();
});

test('affiche le titre et le formulaire', async () => {
  await renderScreen();
  expect(
    screen.getByRole('header', { name: 'Accéder à mon espace' }),
  ).toBeOnTheScreen();
  expect(screen.getByLabelText('Adresse email')).toBeOnTheScreen();
  expect(screen.getByLabelText('Mot de passe')).toBeOnTheScreen();
});

test('champs vides : messages d’erreur, aucun appel', async () => {
  await renderScreen();
  await submit();
  expect(
    await screen.findByText('Saisissez votre adresse email.'),
  ).toBeOnTheScreen();
  expect(screen.getByText('Saisissez votre mot de passe.')).toBeOnTheScreen();
  expect(mockedLogin).not.toHaveBeenCalled();
});

test('email invalide : message dédié', async () => {
  await renderScreen();
  await fill('camille@', 'secret');
  await submit();
  expect(await screen.findByText(/Adresse email invalide/)).toBeOnTheScreen();
  expect(mockedLogin).not.toHaveBeenCalled();
});

test('identifiants refusés : message neutre', async () => {
  mockedLogin.mockRejectedValue(new ApiError(401));
  await renderScreen();
  await fill('  camille@exemple.fr ', 'secret');
  await submit();
  expect(
    await screen.findByText('Adresse email ou mot de passe incorrect.'),
  ).toBeOnTheScreen();
  expect(mockedLogin.mock.calls[0][0]).toEqual({
    email: 'camille@exemple.fr',
    password: 'secret',
  });
});

test('identifiants acceptés : la session est ouverte', async () => {
  mockedLogin.mockResolvedValue(authResponse());
  await renderScreen();
  await fill('camille@exemple.fr', 'secret');
  await submit();
  await waitFor(() => expect(useSession.getState().status).toBe('signedIn'));
  expect(useSession.getState().user?.firstName).toBe('Camille');
});

test('échec réseau : message avec la cause', async () => {
  mockedLogin.mockRejectedValue(new ApiError(null));
  await renderScreen();
  await fill('camille@exemple.fr', 'secret');
  await submit();
  expect(
    await screen.findByText(/Vérifiez votre accès à Internet/),
  ).toBeOnTheScreen();
});

test('erreur puis écran fermé et rouvert : l’ancienne erreur a disparu', async () => {
  mockedLogin.mockRejectedValue(new ApiError(401));
  // La mutation vit dans AuthProvider : seul l'écran est démonté puis remonté.
  function Host() {
    const [open, setOpen] = React.useState(true);
    return (
      <>
        <Pressable accessibilityRole="button" onPress={() => setOpen(o => !o)}>
          <Text>Basculer</Text>
        </Pressable>
        {open ? <ConnexionScreen {...props} /> : null}
      </>
    );
  }
  await renderWithProviders(<Host />);
  await fill('camille@exemple.fr', 'secret');
  await submit();
  expect(
    await screen.findByText('Adresse email ou mot de passe incorrect.'),
  ).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'Basculer' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Basculer' }));
  expect(
    await screen.findByRole('header', { name: 'Accéder à mon espace' }),
  ).toBeOnTheScreen();
  expect(
    screen.queryByText('Adresse email ou mot de passe incorrect.'),
  ).toBeNull();
});

test('liens : mot de passe oublié et création de compte', async () => {
  await renderScreen();
  await fireEvent.press(
    screen.getByRole('link', { name: 'Mot de passe oublié ?' }),
  );
  await fireEvent.press(screen.getByRole('link', { name: 'Créer mon compte' }));
  expect(navigate).toHaveBeenNthCalledWith(1, 'MotDePasse');
  expect(navigate).toHaveBeenNthCalledWith(2, 'Inscription');
});

test('loginErrorMessage', () => {
  expect(loginErrorMessage(new ApiError(401))).toBe(
    'Adresse email ou mot de passe incorrect.',
  );
  expect(loginErrorMessage(new ApiError(429))).toMatch(/Trop de tentatives/);
  expect(loginErrorMessage(new Error('x'))).toMatch(/Internet/);
});

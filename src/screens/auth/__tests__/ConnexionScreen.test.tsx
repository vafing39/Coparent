import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnexionScreen } from '../ConnexionScreen';
import { loginErrorMessage } from '../../../api/auth';
import { login } from '../../../api/authRequests';
import { ApiError } from '../../../api/errors';

jest.mock('../../../api/authRequests', () => ({ login: jest.fn() }));

const mockedLogin = login as jest.MockedFunction<typeof login>;
const navigate = jest.fn();

async function renderScreen() {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  const props = {
    navigation: { navigate },
    route: { key: 'ConnexionEmail', name: 'ConnexionEmail' },
  } as unknown as React.ComponentProps<typeof ConnexionScreen>;
  await render(
    <QueryClientProvider client={client}>
      <ConnexionScreen {...props} />
    </QueryClientProvider>,
  );
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

test('échec réseau : message avec la cause', async () => {
  mockedLogin.mockRejectedValue(new ApiError(null));
  await renderScreen();
  await fill('camille@exemple.fr', 'secret');
  await submit();
  expect(
    await screen.findByText(/Vérifiez votre accès à Internet/),
  ).toBeOnTheScreen();
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

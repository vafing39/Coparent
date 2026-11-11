import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InscriptionScreen } from '../InscriptionScreen';
import { signup } from '../../../api/authRequests';
import { ApiError } from '../../../api/errors';
import { useSession } from '../../../stores/session';
import { authResponse } from '../../../test-utils/authFixtures';

jest.mock('../../../api/authRequests', () => ({
  signup: jest.fn(),
  logout: jest.fn(() => Promise.resolve()),
}));

const mockedSignup = signup as jest.MockedFunction<typeof signup>;
const navigate = jest.fn();
const PASSWORD = 'correct horse battery';

async function renderScreen() {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  const props = {
    navigation: { navigate },
    route: { key: 'Inscription', name: 'Inscription' },
  } as unknown as React.ComponentProps<typeof InscriptionScreen>;
  await render(
    <QueryClientProvider client={client}>
      <InscriptionScreen {...props} />
    </QueryClientProvider>,
  );
}

async function fill({
  email = 'camille@exemple.fr',
  firstName = 'Camille',
  password = PASSWORD,
  confirmPassword = PASSWORD,
} = {}) {
  await fireEvent.changeText(screen.getByLabelText('Adresse email'), email);
  await fireEvent.changeText(screen.getByLabelText('Prénom'), firstName);
  await fireEvent.changeText(screen.getByLabelText('Mot de passe'), password);
  await fireEvent.changeText(
    screen.getByLabelText('Confirmer le mot de passe'),
    confirmPassword,
  );
}

async function submit() {
  await fireEvent.press(
    screen.getByRole('button', { name: 'Créer mon compte' }),
  );
}

beforeEach(() => {
  navigate.mockClear();
  mockedSignup.mockReset();
  useSession.getState().signOut();
});

test('affiche le titre et les quatre champs', async () => {
  await renderScreen();
  expect(
    screen.getByRole('header', { name: 'Créer votre compte' }),
  ).toBeOnTheScreen();
  expect(screen.getByText('12 caractères minimum.')).toBeOnTheScreen();
  expect(screen.getByLabelText('Confirmer le mot de passe')).toBeOnTheScreen();
});

test('champs vides : messages d’erreur, aucun appel', async () => {
  await renderScreen();
  await submit();
  expect(
    await screen.findByText('Saisissez votre adresse email.'),
  ).toBeOnTheScreen();
  expect(screen.getByText('Saisissez votre prénom.')).toBeOnTheScreen();
  expect(
    screen.getByText('Saisissez à nouveau votre mot de passe.'),
  ).toBeOnTheScreen();
  expect(mockedSignup).not.toHaveBeenCalled();
});

test('mot de passe trop court', async () => {
  await renderScreen();
  await fill({ password: 'court', confirmPassword: 'court' });
  await submit();
  // Le message remplace l'indication sous le champ.
  await waitFor(() =>
    expect(screen.getAllByText('12 caractères minimum.')).toHaveLength(1),
  );
  expect(mockedSignup).not.toHaveBeenCalled();
});

test('confirmation différente', async () => {
  await renderScreen();
  await fill({ confirmPassword: 'autre chose encore' });
  await submit();
  expect(
    await screen.findByText('Les mots de passe ne correspondent pas.'),
  ).toBeOnTheScreen();
  expect(mockedSignup).not.toHaveBeenCalled();
});

test('compte créé : la session est ouverte', async () => {
  mockedSignup.mockResolvedValue(authResponse());
  await renderScreen();
  await fill({ email: ' camille@exemple.fr ', firstName: ' Camille ' });
  await submit();
  await waitFor(() => expect(useSession.getState().status).toBe('signedIn'));
  expect(mockedSignup.mock.calls[0][0]).toEqual({
    email: 'camille@exemple.fr',
    firstName: 'Camille',
    password: PASSWORD,
    confirmPassword: PASSWORD,
  });
});

test('adresse déjà utilisée : erreur sous le champ email', async () => {
  mockedSignup.mockRejectedValue(new ApiError(409));
  await renderScreen();
  await fill();
  await submit();
  expect(
    await screen.findByText('Un compte existe déjà avec cette adresse email.'),
  ).toBeOnTheScreen();
});

test('mot de passe refusé par le serveur : détail affiché', async () => {
  mockedSignup.mockRejectedValue(
    new ApiError(400, 'Ce mot de passe figure dans une fuite de données.'),
  );
  await renderScreen();
  await fill();
  await submit();
  expect(
    await screen.findByText(
      'Ce mot de passe figure dans une fuite de données.',
    ),
  ).toBeOnTheScreen();
});

test('échec réseau : message général', async () => {
  mockedSignup.mockRejectedValue(new ApiError(null));
  await renderScreen();
  await fill();
  await submit();
  expect(
    await screen.findByText(/Vérifiez votre accès à Internet/),
  ).toBeOnTheScreen();
});

test('« Se connecter » mène à la connexion', async () => {
  await renderScreen();
  await fireEvent.press(screen.getByRole('link', { name: 'Se connecter' }));
  expect(navigate).toHaveBeenCalledWith('ConnexionEmail');
});

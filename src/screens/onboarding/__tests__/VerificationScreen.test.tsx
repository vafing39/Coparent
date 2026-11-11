import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VerificationScreen } from '../VerificationScreen';
import {
  resendEmailVerification,
  verifyEmail,
} from '../../../api/authRequests';
import { ApiError } from '../../../api/errors';
import { useSession } from '../../../stores/session';
import { authResponse } from '../../../test-utils/authFixtures';

jest.mock('../../../api/authRequests', () => ({
  resendEmailVerification: jest.fn(),
  verifyEmail: jest.fn(),
  logout: jest.fn(() => Promise.resolve()),
}));

const mockedResend = resendEmailVerification as jest.MockedFunction<
  typeof resendEmailVerification
>;
const mockedVerify = verifyEmail as jest.MockedFunction<typeof verifyEmail>;
const user = authResponse().user;

async function renderScreen() {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  await render(
    <QueryClientProvider client={client}>
      <VerificationScreen />
    </QueryClientProvider>,
  );
}

async function typeCode(code: string) {
  await fireEvent.changeText(
    screen.getByLabelText('Code de vérification'),
    code,
  );
}

beforeEach(async () => {
  mockedResend.mockReset();
  mockedVerify.mockReset();
  await useSession.getState().signIn(authResponse());
});

test('affiche l’étape, l’adresse et le champ du code', async () => {
  await renderScreen();
  expect(
    screen.getByRole('header', { name: 'Vérifiez votre adresse email' }),
  ).toBeOnTheScreen();
  expect(screen.getByRole('progressbar')).toHaveAccessibilityValue({
    now: 1,
    max: 5,
  });
  expect(screen.getByText(/camille@exemple\.fr/)).toBeOnTheScreen();
  expect(screen.getByLabelText('Code de vérification')).toBeOnTheScreen();
});

test('8 chiffres saisis : envoi automatique, la session est mise à jour', async () => {
  mockedVerify.mockResolvedValue({ ...user, emailVerified: true });
  await renderScreen();
  await typeCode('48291375');
  await waitFor(() =>
    expect(useSession.getState().user?.emailVerified).toBe(true),
  );
  expect(mockedVerify.mock.calls[0][0]).toBe('48291375');
});

test('code collé avec un espace : seuls les chiffres sont envoyés', async () => {
  mockedVerify.mockResolvedValue({ ...user, emailVerified: true });
  await renderScreen();
  await typeCode('4829 1375');
  await waitFor(() => expect(mockedVerify).toHaveBeenCalled());
  expect(mockedVerify.mock.calls[0][0]).toBe('48291375');
});

test('code incomplet : message, aucun appel', async () => {
  await renderScreen();
  await typeCode('4829');
  await fireEvent.press(screen.getByRole('button', { name: 'Valider' }));
  expect(
    await screen.findByText('Le code contient 8 chiffres.'),
  ).toBeOnTheScreen();
  expect(mockedVerify).not.toHaveBeenCalled();
});

test('code refusé : message sous le champ', async () => {
  mockedVerify.mockRejectedValue(new ApiError(400));
  await renderScreen();
  await typeCode('00000000');
  expect(await screen.findByText(/Code incorrect ou expiré/)).toBeOnTheScreen();
  expect(useSession.getState().user?.emailVerified).toBe(false);
});

test('trop d’essais : message dédié', async () => {
  mockedVerify.mockRejectedValue(new ApiError(429));
  await renderScreen();
  await typeCode('00000000');
  expect(await screen.findByText(/Trop de tentatives/)).toBeOnTheScreen();
});

test('renvoi : confirmation affichée', async () => {
  mockedResend.mockResolvedValue();
  await renderScreen();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Renvoyer le code' }),
  );
  expect(
    await screen.findByText('Un nouveau code vient d’être envoyé.'),
  ).toBeOnTheScreen();
});

test('« Modifier l’adresse » ferme la session et rouvre l’inscription', async () => {
  await renderScreen();
  await fireEvent.press(
    screen.getByRole('button', { name: "Modifier l'adresse" }),
  );
  await waitFor(() => expect(useSession.getState().status).toBe('signedOut'));
  expect(useSession.getState().authEntry).toBe('Inscription');
});

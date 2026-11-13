import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { CompteFamilleScreen } from '../CompteFamilleScreen';
import type { Family } from '../../../api/types';
import { FamilyProvider } from '../../../context/FamilyContext';
import { useSession } from '../../../stores/session';
import { authResponse } from '../../../test-utils/authFixtures';
import { authApi, familyApi } from '../../../test-utils/fakeApiClient';
import { family } from '../../../test-utils/familyFixtures';
import { renderWithProviders } from '../../../test-utils/render';

jest.mock('../../../api/client', () =>
  jest.requireActual('../../../test-utils/fakeApiClient'),
);

const TWO_PARENTS: Family = family({
  solo: false,
  members: [
    { userId: 'u1', firstName: 'Camille', role: 'PARENT_A' },
    { userId: 'u2', firstName: 'Julien', role: 'PARENT_B' },
  ],
});

const navigate = jest.fn();
const goBack = jest.fn();
const props = {
  navigation: { navigate, goBack },
  route: { key: 'CompteFamille', name: 'CompteFamille' },
} as unknown as React.ComponentProps<typeof CompteFamilleScreen>;

async function renderScreen(value: Family) {
  familyApi.fetchMyFamily.mockResolvedValue(value);
  await renderWithProviders(
    <FamilyProvider>
      <CompteFamilleScreen {...props} />
    </FamilyProvider>,
  );
  await screen.findByRole('header', { name: 'Compte et famille' });
}

beforeEach(async () => {
  navigate.mockReset();
  goBack.mockReset();
  authApi.logout.mockReset().mockResolvedValue(undefined);
  await useSession.getState().signIn(authResponse());
});

test('la famille à deux parents', async () => {
  await renderScreen(TWO_PARENTS);
  expect(screen.getByText('Famille Martin')).toBeOnTheScreen();
  expect(screen.getByText('Camille et Julien')).toBeOnTheScreen();
});

test('la famille en mode solo', async () => {
  await renderScreen(family());
  expect(
    screen.getByText(
      "Mode solo : l'autre parent n'a pas encore rejoint la famille.",
    ),
  ).toBeOnTheScreen();
});

test('« Réglages » ouvre les réglages, la flèche revient', async () => {
  await renderScreen(TWO_PARENTS);
  await fireEvent.press(screen.getByRole('button', { name: 'Réglages' }));
  expect(navigate).toHaveBeenCalledWith('Reglages');
  await fireEvent.press(screen.getByRole('button', { name: 'Retour' }));
  expect(goBack).toHaveBeenCalled();
});

test('« Se déconnecter » demande confirmation puis ferme la session', async () => {
  const alert = jest.spyOn(Alert, 'alert');
  await renderScreen(TWO_PARENTS);
  await fireEvent.press(screen.getByRole('button', { name: 'Se déconnecter' }));
  expect(alert.mock.calls[0][0]).toBe('Se déconnecter ?');
  const buttons = alert.mock.calls[0][2] ?? [];
  const confirm = buttons.find(b => b.text === 'Se déconnecter');
  expect(confirm?.style).toBe('destructive');
  await confirm?.onPress?.();
  await waitFor(() => expect(authApi.logout).toHaveBeenCalledWith('refresh-1'));
  expect(useSession.getState().status).toBe('signedOut');
  alert.mockRestore();
});

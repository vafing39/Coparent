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

test('la famille en mode solo : inviter l’autre parent', async () => {
  await renderScreen(family());
  expect(
    screen.getByText(
      "Mode solo : l'autre parent n'a pas encore rejoint la famille.",
    ),
  ).toBeOnTheScreen();
  await fireEvent.press(
    screen.getByRole('button', { name: "Inviter l'autre parent" }),
  );
  expect(navigate).toHaveBeenCalledWith('InviterParent');
});

test('mode solo avec un lien envoyé : son état et « Renvoyer l’invitation »', async () => {
  await renderScreen(
    family({
      invitation: {
        inviteeFirstName: 'Julien',
        sentAt: '2026-11-10T10:00:00Z',
        expiresAt: '2026-11-17T10:00:00Z',
        expired: false,
      },
    }),
  );
  expect(
    screen.getByText(
      "Invitation envoyée à Julien le 10 novembre, valable jusqu'au 17 novembre.",
    ),
  ).toBeOnTheScreen();
  await fireEvent.press(
    screen.getByRole('button', { name: "Renvoyer l'invitation" }),
  );
  expect(navigate).toHaveBeenCalledWith('InviterParent');
});

test('à deux parents : rien à inviter', async () => {
  await renderScreen(TWO_PARENTS);
  expect(
    screen.queryByRole('button', { name: "Inviter l'autre parent" }),
  ).toBeNull();
});

test('« Mon compte » : l’adresse et les trois actions', async () => {
  await renderScreen(TWO_PARENTS);
  expect(screen.getByText('camille@exemple.fr')).toBeOnTheScreen();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Modifier le mot de passe' }),
  );
  expect(navigate).toHaveBeenCalledWith('ModifierMotDePasse');
  await fireEvent.press(
    screen.getByRole('button', { name: 'Télécharger mes données' }),
  );
  expect(navigate).toHaveBeenCalledWith('MesDonnees');
  await fireEvent.press(
    screen.getByRole('button', { name: 'Supprimer mon compte' }),
  );
  expect(navigate).toHaveBeenCalledWith('SupprimerCompte');
});

test('« Réglages » : apparence et couleurs du calendrier ouvrent leur page', async () => {
  await renderScreen(TWO_PARENTS);
  expect(screen.getByRole('header', { name: 'Réglages' })).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Apparence' }));
  expect(navigate).toHaveBeenCalledWith('Apparence');
  await fireEvent.press(
    screen.getByRole('button', { name: 'Couleurs du calendrier' }),
  );
  expect(navigate).toHaveBeenCalledWith('CouleursCalendrier');
});

test('la flèche revient', async () => {
  await renderScreen(TWO_PARENTS);
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

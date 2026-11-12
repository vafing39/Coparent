import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';
import { AccueilScreen } from '../AccueilScreen';
import { ApiError } from '../../../api/errors';
import type { Custody, Family } from '../../../api/types';
import { BagProvider } from '../../../context/BagContext';
import { CustodyProvider } from '../../../context/CustodyContext';
import { FamilyProvider } from '../../../context/FamilyContext';
import { useSession } from '../../../stores/session';
import { authResponse } from '../../../test-utils/authFixtures';
import {
  authApi,
  bagApi,
  EMPTY_BAG,
  familyApi,
} from '../../../test-utils/fakeApiClient';
import { family } from '../../../test-utils/familyFixtures';
import { renderWithProviders } from '../../../test-utils/render';

jest.mock('../../../api/client', () =>
  jest.requireActual('../../../test-utils/fakeApiClient'),
);

/** Mardi 10 novembre 2026, 19 h 30 à Paris. */
const EVENING = new Date('2026-11-10T18:30:00Z');
const TODAY = '2026-11-10';

const navigate = jest.fn();
const props = {
  navigation: { navigate },
  route: { key: 'Accueil', name: 'Accueil' },
} as unknown as React.ComponentProps<typeof AccueilScreen>;

const CHILDREN = [
  { id: 'c1', firstName: 'Léa', birthDate: '2018-03-03' },
  { id: 'c2', firstName: 'Hugo', birthDate: '2020-05-12' },
];

const TWO_PARENTS: Family = family({
  solo: false,
  members: [
    { userId: 'u1', firstName: 'Camille', role: 'PARENT_A' },
    { userId: 'u2', firstName: 'Julien', role: 'PARENT_B' },
  ],
  children: CHILDREN,
});

function custody(overrides: Partial<Custody> = {}): Custody {
  return {
    scheduleStatus: 'ACTIVE',
    nights: [
      { date: TODAY, parent: 'PARENT_B', period: 'REGULAR', holiday: null },
    ],
    handovers: [],
    nextHandover: {
      at: '2026-11-13T17:50:00',
      from: 'PARENT_B',
      to: 'PARENT_A',
    },
    ...overrides,
  };
}

async function renderScreen(found: Family, response: Custody = custody()) {
  familyApi.fetchMyFamily.mockResolvedValue(found);
  familyApi.custody.mockResolvedValue(response);
  await renderWithProviders(
    <FamilyProvider>
      <CustodyProvider>
        <BagProvider>
          <AccueilScreen {...props} />
        </BagProvider>
      </CustodyProvider>
    </FamilyProvider>,
  );
}

beforeEach(async () => {
  navigate.mockReset();
  jest.useFakeTimers({ now: EVENING });
  familyApi.fetchMyFamily.mockReset();
  familyApi.custody.mockReset();
  bagApi.get.mockReset().mockResolvedValue(EMPTY_BAG);
  authApi.logout.mockReset().mockResolvedValue(undefined);
  await useSession.getState().signIn(authResponse());
});

afterEach(() => {
  jest.useRealTimers();
});

test('famille à deux : ce soir, prochain passage et cartes vides', async () => {
  await renderScreen(TWO_PARENTS);
  expect(
    await screen.findByText('Léa et Hugo sont chez Julien'),
  ).toBeOnTheScreen();
  expect(familyApi.custody).toHaveBeenCalledWith(TWO_PARENTS.id, TODAY, TODAY);
  expect(
    screen.getByRole('header', { name: 'Bonsoir Camille' }),
  ).toBeOnTheScreen();
  expect(screen.getByText('mardi 10 novembre')).toBeOnTheScreen();
  expect(screen.getByText('Ce soir')).toBeOnTheScreen();
  expect(
    screen.getByText("Jusqu'au vendredi 13 novembre, 17 h 50"),
  ).toBeOnTheScreen();
  expect(screen.getByText('dans 3 jours')).toBeOnTheScreen();
  expect(screen.getByText('ven. 13 nov. · 17 h 50')).toBeOnTheScreen();
  expect(screen.getByText('Julien vers Camille')).toBeOnTheScreen();
  expect(screen.getByText("Rien de prévu aujourd'hui.")).toBeOnTheScreen();
  expect(screen.getByText("Rien à traiter pour l'instant.")).toBeOnTheScreen();
  expect(
    screen.queryByText("L'autre parent n'a pas encore rejoint la famille."),
  ).toBeNull();
});

test('le matin : « Bonjour »', async () => {
  jest.setSystemTime(new Date('2026-11-10T08:00:00Z'));
  await renderScreen(TWO_PARENTS);
  expect(
    await screen.findByRole('header', { name: 'Bonjour Camille' }),
  ).toBeOnTheScreen();
});

test('mode solo : bannière, rythme proposé, « l’autre parent »', async () => {
  await renderScreen(
    family({ children: [CHILDREN[0]] }),
    custody({ scheduleStatus: 'PROPOSED' }),
  );
  expect(
    await screen.findByText("Léa est chez l'autre parent"),
  ).toBeOnTheScreen();
  expect(
    screen.getByText("L'autre parent n'a pas encore rejoint la famille."),
  ).toBeOnTheScreen();
  expect(
    screen.getByText("Ce soir, d'après le rythme proposé"),
  ).toBeOnTheScreen();
  expect(screen.getByText("l'autre parent vers Camille")).toBeOnTheScreen();
});

test('passage demain', async () => {
  await renderScreen(
    TWO_PARENTS,
    custody({
      nextHandover: {
        at: '2026-11-11T08:30:00',
        from: 'PARENT_B',
        to: 'PARENT_A',
      },
    }),
  );
  expect(await screen.findByText('demain')).toBeOnTheScreen();
  expect(screen.getByText('mer. 11 nov. · 8 h 30')).toBeOnTheScreen();
});

test('aucun passage prévu : pas de carte « Prochain passage »', async () => {
  await renderScreen(TWO_PARENTS, custody({ nextHandover: null }));
  expect(
    await screen.findByText('Léa et Hugo sont chez Julien'),
  ).toBeOnTheScreen();
  expect(screen.queryByText('Prochain passage')).toBeNull();
  expect(screen.queryByRole('link', { name: 'Sac à préparer' })).toBeNull();
  expect(screen.queryByText(/^Jusqu'au/)).toBeNull();
});

test('erreur de chargement puis « Réessayer »', async () => {
  familyApi.fetchMyFamily.mockResolvedValue(TWO_PARENTS);
  familyApi.custody.mockRejectedValueOnce(new ApiError(500));
  familyApi.custody.mockResolvedValueOnce(custody());
  await renderWithProviders(
    <FamilyProvider>
      <CustodyProvider>
        <BagProvider>
          <AccueilScreen {...props} />
        </BagProvider>
      </CustodyProvider>
    </FamilyProvider>,
  );
  expect(
    await screen.findByText(
      'Impossible de charger la garde. Vérifiez votre connexion.',
    ),
  ).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Réessayer' }));
  expect(
    await screen.findByText('Léa et Hugo sont chez Julien'),
  ).toBeOnTheScreen();
});

test('l’avatar ouvre le menu de déconnexion', async () => {
  const alert = jest.spyOn(Alert, 'alert');
  await renderScreen(TWO_PARENTS);
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Compte et famille' }),
  );
  const buttons = alert.mock.calls[0][2] ?? [];
  const signOut = buttons.find(b => b.text === 'Se déconnecter');
  expect(signOut?.style).toBe('destructive');
  await signOut?.onPress?.();
  await screen.findByText('Léa et Hugo sont chez Julien');
  expect(authApi.logout).toHaveBeenCalledWith('refresh-1');
  alert.mockRestore();
});

test('« Tout voir » ouvre l’écran « À traiter »', async () => {
  await renderScreen(TWO_PARENTS);
  await fireEvent.press(await screen.findByRole('link', { name: 'Tout voir' }));
  expect(navigate).toHaveBeenCalledWith('ATraiter');
});

test('« Sac à préparer » ouvre l’écran du sac', async () => {
  await renderScreen(TWO_PARENTS);
  await fireEvent.press(
    await screen.findByRole('link', { name: 'Sac à préparer' }),
  );
  expect(navigate).toHaveBeenCalledWith('SacAPreparer');
});

test('sac vide : la ligne « Sac à préparer » sans compte', async () => {
  await renderScreen(TWO_PARENTS);
  expect(
    await screen.findByRole('link', { name: 'Sac à préparer' }),
  ).toBeOnTheScreen();
  expect(screen.queryByText(/sur \d+ cochés/)).toBeNull();
});

test('sac rempli : « 3 sur 7 cochés » sur la ligne', async () => {
  bagApi.get.mockResolvedValue({
    ...EMPTY_BAG,
    handoverAt: '2026-11-13T17:50:00',
    checkedCount: 3,
    total: 7,
  });
  await renderScreen(TWO_PARENTS);
  expect(await screen.findByText('3 sur 7 cochés')).toBeOnTheScreen();
  expect(bagApi.get).toHaveBeenCalledWith(TWO_PARENTS.id);
});

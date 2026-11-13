import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { ATraiterScreen } from '../ATraiterScreen';
import { ApiError } from '../../../api/errors';
import type { ToDo } from '../../../api/types';
import { FamilyProvider } from '../../../context/FamilyContext';
import { ToDoProvider } from '../../../context/ToDoContext';
import { useSession } from '../../../stores/session';
import { authResponse } from '../../../test-utils/authFixtures';
import {
  EMPTY_TO_DO,
  familyApi,
  toDoApi,
} from '../../../test-utils/fakeApiClient';
import { family } from '../../../test-utils/familyFixtures';
import { renderWithProviders } from '../../../test-utils/render';

jest.mock('../../../api/client', () =>
  jest.requireActual('../../../test-utils/fakeApiClient'),
);

const goBack = jest.fn();
const props = {
  navigation: { goBack },
  route: { key: 'ATraiter', name: 'ATraiter' },
} as unknown as React.ComponentProps<typeof ATraiterScreen>;

/** Mardi 10 novembre 2026, 19 h 30 à Paris. */
const NOW = new Date('2026-11-10T18:30:00Z');

const TO_DO: ToDo = {
  mine: [
    {
      id: 't1',
      kind: 'EXPENSE',
      subject: 'Cantine de novembre · 64,20 €',
      requestedBy: 'Julien',
      assignee: 'Camille',
      requestedAt: '2026-11-10T07:00:00Z',
      lastNudgedAt: null,
    },
    {
      id: 't2',
      kind: 'EXCHANGE',
      subject: 'Échange du week-end 21-22 nov.',
      requestedBy: null,
      assignee: 'Camille',
      requestedAt: '2026-11-09T07:00:00Z',
      lastNudgedAt: null,
    },
  ],
  theirs: [
    {
      id: 't3',
      kind: 'PUBLICATION_REMOVAL',
      subject: 'Photo publiée par Odile',
      requestedBy: 'Camille',
      assignee: 'Julien',
      requestedAt: '2026-11-02T07:00:00Z',
      lastNudgedAt: null,
    },
  ],
};

async function renderScreen() {
  await renderWithProviders(
    <FamilyProvider>
      <ToDoProvider>
        <ATraiterScreen {...props} />
      </ToDoProvider>
    </FamilyProvider>,
  );
}

beforeEach(async () => {
  jest.useFakeTimers({ now: NOW });
  goBack.mockReset();
  familyApi.fetchMyFamily.mockResolvedValue(family());
  toDoApi.get.mockReset().mockResolvedValue(TO_DO);
  toDoApi.nudge.mockReset();
  await useSession.getState().signIn(authResponse());
});

afterEach(() => {
  jest.useRealTimers();
});

test('les deux sections, avec qui demande et depuis quand', async () => {
  await renderScreen();
  expect(
    await screen.findByRole('header', { name: 'À vous de répondre · 2' }),
  ).toBeOnTheScreen();
  expect(screen.getByText('Cantine de novembre · 64,20 €')).toBeOnTheScreen();
  expect(
    screen.getByText("Dépense à valider · Julien, aujourd'hui"),
  ).toBeOnTheScreen();
  // Compte supprimé : « l'autre parent »
  expect(
    screen.getByText("Échange à valider · l'autre parent, hier"),
  ).toBeOnTheScreen();
  expect(
    screen.getByRole('header', { name: 'En attente de Julien · 1' }),
  ).toBeOnTheScreen();
  expect(
    screen.getByText('Retrait de publication demandé · il y a 8 jours'),
  ).toBeOnTheScreen();
  // Ce qui se passe sans réponse, « Relancer » et la règle
  expect(
    screen.getByText(
      'Sans réponse après 14 jours, la publication reste masquée et vous pouvez en parler par message.',
    ),
  ).toBeOnTheScreen();
  expect(
    screen.getByRole('button', { name: 'Relancer Julien' }),
  ).toBeOnTheScreen();
  expect(
    screen.getByText(
      "Une relance par jour au maximum, envoyée par l'app avec un texte neutre.",
    ),
  ).toBeOnTheScreen();
  // Rien de tout cela pour ce qui m'attend
  expect(screen.getAllByRole('button', { name: /Relancer/ })).toHaveLength(1);
  expect(screen.queryByText(/la dépense n'entre pas/)).toBeNull();
  expect(screen.queryByText("Rien à traiter pour l'instant.")).toBeNull();
  expect(toDoApi.get).toHaveBeenCalledWith(family().id);

  await fireEvent.press(screen.getByRole('button', { name: 'Retour' }));
  expect(goBack).toHaveBeenCalled();
});

test('seulement des demandes de l’autre parent : pas de section vide', async () => {
  toDoApi.get.mockResolvedValue({ mine: [], theirs: TO_DO.theirs });
  await renderScreen();
  expect(
    await screen.findByRole('header', { name: 'En attente de Julien · 1' }),
  ).toBeOnTheScreen();
  expect(screen.queryByText(/À vous de répondre/)).toBeNull();
});

test('vide', async () => {
  toDoApi.get.mockResolvedValue(EMPTY_TO_DO);
  await renderScreen();
  expect(
    await screen.findByText("Rien à traiter pour l'instant."),
  ).toBeOnTheScreen();
  expect(screen.getByRole('header', { name: 'À traiter' })).toBeOnTheScreen();
});

test('erreur de chargement puis « Réessayer »', async () => {
  toDoApi.get.mockRejectedValueOnce(new ApiError(500));
  await renderScreen();
  expect(
    await screen.findByText(
      'Impossible de charger les demandes. Vérifiez votre connexion.',
    ),
  ).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Réessayer' }));
  expect(
    await screen.findByRole('header', { name: 'À vous de répondre · 2' }),
  ).toBeOnTheScreen();
});

test('« Relancer » : envoyé, puis « Rappel envoyé » jusqu’à demain', async () => {
  toDoApi.nudge.mockResolvedValue({
    ...TO_DO,
    theirs: [{ ...TO_DO.theirs[0], lastNudgedAt: '2026-11-10T18:30:00Z' }],
  });
  await renderScreen();
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Relancer Julien' }),
  );
  expect(toDoApi.nudge).toHaveBeenCalledWith(family().id, 't3');
  expect(
    await screen.findByText('Rappel envoyé · prochain possible demain'),
  ).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Relancer Julien' })).toBeNull();
});

test('relancé hier : le bouton revient ; relancé aujourd’hui : non', async () => {
  toDoApi.get.mockResolvedValue({
    mine: [],
    theirs: [
      { ...TO_DO.theirs[0], lastNudgedAt: '2026-11-09T22:30:00Z' }, // 23 h 30 à Paris, le 9
      {
        ...TO_DO.theirs[0],
        id: 't4',
        subject: 'Tablette de Hugo',
        kind: 'DEVICE',
        lastNudgedAt: '2026-11-09T23:30:00Z', // 0 h 30 à Paris, le 10
      },
    ],
  });
  await renderScreen();
  expect(
    await screen.findAllByRole('button', { name: 'Relancer Julien' }),
  ).toHaveLength(1);
  expect(
    screen.getByText('Rappel envoyé · prochain possible demain'),
  ).toBeOnTheScreen();
  expect(
    screen.getByText(
      "Tant que Julien n'a pas validé, l'espace enfant ne s'ouvre pas sur cet appareil.",
    ),
  ).toBeOnTheScreen();
});

test('« Relancer » refusé (déjà relancé) : message sous le bouton', async () => {
  toDoApi.nudge.mockRejectedValue(new ApiError(429));
  await renderScreen();
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Relancer Julien' }),
  );
  expect(
    await screen.findByText('Une relance par jour au maximum.'),
  ).toBeOnTheScreen();
});

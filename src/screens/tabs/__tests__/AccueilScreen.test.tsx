import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { AccueilScreen } from '../AccueilScreen';
import { ApiError } from '../../../api/errors';
import type { CalendarEvent, Custody, Family } from '../../../api/types';
import { BagProvider } from '../../../context/BagContext';
import { CalendarProvider } from '../../../context/CalendarContext';
import { CustodyProvider } from '../../../context/CustodyContext';
import { FamilyProvider } from '../../../context/FamilyContext';
import { ToDoProvider } from '../../../context/ToDoContext';
import { useSession } from '../../../stores/session';
import { authResponse } from '../../../test-utils/authFixtures';
import {
  authApi,
  bagApi,
  EMPTY_BAG,
  EMPTY_TO_DO,
  eventApi,
  familyApi,
  toDoApi,
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
        <CalendarProvider>
          <BagProvider>
            <ToDoProvider>
              <AccueilScreen {...props} />
            </ToDoProvider>
          </BagProvider>
        </CalendarProvider>
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
  toDoApi.get.mockReset().mockResolvedValue(EMPTY_TO_DO);
  eventApi.list.mockReset().mockResolvedValue([]);
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
    screen.getByRole('header', { name: 'mardi 10 novembre' }),
  ).toBeOnTheScreen();
  expect(screen.queryByText(/Bonjour|Bonsoir/)).toBeNull();
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
  await fireEvent.press(
    screen.getByRole('button', { name: "Inviter l'autre parent" }),
  );
  expect(navigate).toHaveBeenCalledWith('InviterParent');
});

test('mode solo : où en est l’invitation, « Renvoyer l’invitation »', async () => {
  await renderScreen(
    family({
      children: [CHILDREN[0]],
      invitation: {
        inviteeFirstName: 'Julien',
        sentAt: '2026-11-01T10:00:00Z',
        expiresAt: '2026-11-08T10:00:00Z',
        expired: true,
      },
    }),
    custody({ scheduleStatus: 'PROPOSED' }),
  );
  expect(
    await screen.findByText('Le lien envoyé à Julien le 1 novembre a expiré.'),
  ).toBeOnTheScreen();
  await fireEvent.press(
    screen.getByRole('button', { name: "Renvoyer l'invitation" }),
  );
  expect(navigate).toHaveBeenCalledWith('InviterParent');
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
  // La garde du jour (from = to) échoue une fois ; le calendrier, chargé aussi, réussit.
  let failed = false;
  familyApi.custody.mockImplementation(async (_id, from, to) => {
    if (from === to && !failed) {
      failed = true;
      throw new ApiError(500);
    }
    return custody();
  });
  await renderWithProviders(
    <FamilyProvider>
      <CustodyProvider>
        <CalendarProvider>
          <BagProvider>
            <ToDoProvider>
              <AccueilScreen {...props} />
            </ToDoProvider>
          </BagProvider>
        </CalendarProvider>
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

test('l’avatar ouvre « Compte et famille »', async () => {
  await renderScreen(TWO_PARENTS);
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Compte et famille' }),
  );
  expect(navigate).toHaveBeenCalledWith('CompteFamille');
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

test('« À traiter » : les deux premières demandes, les miennes d’abord, et « Tout voir (3) »', async () => {
  toDoApi.get.mockResolvedValue({
    mine: [
      {
        id: 't1',
        kind: 'EXCHANGE',
        targetId: 'ex-1',
        subject: 'Échange du week-end 21-22 nov.',
        requestedBy: 'Julien',
        assignee: 'Camille',
        requestedAt: '2026-11-07T09:00:00Z',
        lastNudgedAt: null,
      },
    ],
    theirs: [
      {
        id: 't2',
        kind: 'DEVICE',
        targetId: null,
        subject: 'Tablette de Hugo',
        requestedBy: 'Camille',
        assignee: 'Julien',
        requestedAt: '2026-11-09T09:00:00Z',
        lastNudgedAt: null,
      },
      {
        id: 't3',
        kind: 'PENSION',
        targetId: null,
        subject: 'Pension de novembre',
        requestedBy: 'Camille',
        assignee: 'Julien',
        requestedAt: '2026-11-10T09:00:00Z',
        lastNudgedAt: null,
      },
    ],
  });
  await renderScreen(TWO_PARENTS);
  expect(
    await screen.findByText('Échange du week-end 21-22 nov.'),
  ).toBeOnTheScreen();
  expect(
    screen.getByText('Échange à valider · Julien, il y a 3 jours'),
  ).toBeOnTheScreen();
  expect(screen.getByText('Tablette de Hugo')).toBeOnTheScreen();
  expect(screen.getByText('Appareil à valider · hier')).toBeOnTheScreen();
  expect(screen.queryByText('Pension de novembre')).toBeNull();
  expect(screen.queryByText("Rien à traiter pour l'instant.")).toBeNull();
  await fireEvent.press(screen.getByRole('link', { name: 'Tout voir (3)' }));
  expect(navigate).toHaveBeenCalledWith('ATraiter');
  // Une demande d'échange ouvre son écran ; les autres lignes ne sont pas des boutons
  await fireEvent.press(
    screen.getByRole('button', { name: /^Échange du week-end 21-22 nov\./ }),
  );
  expect(navigate).toHaveBeenCalledWith('ExchangeDetail', {
    exchangeId: 'ex-1',
  });
  expect(
    screen.queryByRole('button', { name: /^Tablette de Hugo/ }),
  ).toBeNull();
});

test('« À traiter » en erreur puis « Réessayer »', async () => {
  toDoApi.get.mockRejectedValueOnce(new ApiError(500));
  await renderScreen(TWO_PARENTS);
  expect(
    await screen.findByText(
      'Impossible de charger les demandes. Vérifiez votre connexion.',
    ),
  ).toBeOnTheScreen();
  const retries = screen.getAllByRole('button', { name: 'Réessayer' });
  await fireEvent.press(retries[retries.length - 1]);
  expect(
    await screen.findByText("Rien à traiter pour l'instant."),
  ).toBeOnTheScreen();
});

const JUDO: CalendarEvent = {
  id: 'e1',
  title: 'Judo',
  type: 'ACTIVITY',
  children: [{ id: 'c2', firstName: 'Hugo' }],
  allDay: false,
  date: TODAY,
  startTime: '16:30:00',
  endTime: '17:30:00',
  location: 'Dojo municipal',
  reminder: 'NONE',
  visibility: 'SHARED',
  authorFirstName: 'Camille',
  mine: true,
  repeat: null,
  createdAt: '2026-11-01T10:00:00Z',
  updatedAt: '2026-11-01T10:00:00Z',
};

test('« Aujourd’hui » : les événements du jour, un appui ouvre le détail', async () => {
  const birthday: CalendarEvent = {
    ...JUDO,
    id: 'e2',
    title: 'Anniversaire de Mamie Odile',
    type: 'OTHER',
    allDay: true,
    startTime: null,
    endTime: null,
    location: null,
    children: CHILDREN.map(({ id, firstName }) => ({ id, firstName })),
  };
  const tomorrow: CalendarEvent = { ...JUDO, id: 'e3', date: '2026-11-11' };
  eventApi.list.mockResolvedValue([birthday, JUDO, tomorrow]);
  await renderScreen(TWO_PARENTS);
  expect(await screen.findByText('Judo')).toBeOnTheScreen();
  expect(screen.getByText('16 h 30')).toBeOnTheScreen();
  expect(screen.getByText('Hugo · Dojo municipal · Partagé')).toBeOnTheScreen();
  expect(screen.getByText('Journée')).toBeOnTheScreen();
  expect(screen.getByText('Anniversaire de Mamie Odile')).toBeOnTheScreen();
  expect(screen.getAllByText('Judo')).toHaveLength(1);
  expect(screen.queryByText("Rien de prévu aujourd'hui.")).toBeNull();

  await fireEvent.press(screen.getByText('Judo'));
  expect(navigate).toHaveBeenCalledWith('EventDetail', { event: JUDO });
});

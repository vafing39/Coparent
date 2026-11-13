import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { CalendrierScreen } from '../CalendrierScreen';
import { ApiError } from '../../../api/errors';
import type {
  CalendarEvent,
  Custody,
  CustodyNight,
  Family,
  FamilyRole,
} from '../../../api/types';
import { CalendarProvider } from '../../../context/CalendarContext';
import { FamilyProvider } from '../../../context/FamilyContext';
import { addDays } from '../../../features/calendar/calendarDays';
import { useSession } from '../../../stores/session';
import { authResponse } from '../../../test-utils/authFixtures';
import { eventApi, familyApi } from '../../../test-utils/fakeApiClient';
import { family } from '../../../test-utils/familyFixtures';
import { renderWithProviders } from '../../../test-utils/render';

jest.mock('../../../api/client', () =>
  jest.requireActual('../../../test-utils/fakeApiClient'),
);

/** Mardi 10 novembre 2026, 19 h 30 à Paris. */
const NOW = new Date('2026-11-10T18:30:00Z');

const TWO_PARENTS: Family = family({
  solo: false,
  members: [
    { userId: 'u1', firstName: 'Camille', role: 'PARENT_A' },
    { userId: 'u2', firstName: 'Julien', role: 'PARENT_B' },
  ],
  children: [{ id: 'c1', firstName: 'Léa', birthDate: '2018-03-03' }],
});

/**
 * Une semaine sur deux, passage le vendredi à 17 h 50 : Julien (B) du vendredi 6 au jeudi
 * 12 novembre, Camille (A) du vendredi 13 au jeudi 19, etc. Vacances de Noël à partir du 19 décembre.
 */
function custody(from: string, to: string): Custody {
  const nights: CustodyNight[] = [];
  const handovers: Custody['handovers'] = [];
  for (let date = from; date <= to; date = addDays(date, 1)) {
    const weeks = Math.floor(
      (Date.parse(`${date}T00:00:00Z`) - Date.parse('2026-11-06T00:00:00Z')) /
        (7 * 24 * 3600 * 1000),
    );
    const parent: FamilyRole = weeks % 2 === 0 ? 'PARENT_B' : 'PARENT_A';
    const holiday = date >= '2026-12-19' && date <= '2027-01-03';
    nights.push({
      date,
      parent,
      period: holiday ? 'SHORT_HOLIDAY' : 'REGULAR',
      holiday: holiday ? 'Vacances de Noël' : null,
    });
    if (new Date(`${date}T00:00:00Z`).getUTCDay() === 5) {
      handovers.push({
        at: `${date}T17:50:00`,
        from: parent === 'PARENT_A' ? 'PARENT_B' : 'PARENT_A',
        to: parent,
      });
    }
  }
  return { scheduleStatus: 'ACTIVE', nights, handovers, nextHandover: null };
}

const navigate = jest.fn();
const props = {
  navigation: { navigate },
  route: { key: 'Calendrier', name: 'Calendrier' },
} as unknown as React.ComponentProps<typeof CalendrierScreen>;

async function renderScreen() {
  await renderWithProviders(
    <FamilyProvider>
      <CalendarProvider>
        <CalendrierScreen {...props} />
      </CalendarProvider>
    </FamilyProvider>,
  );
}

const ORTHOPHONISTE: CalendarEvent = {
  id: 'e1',
  title: 'Orthophoniste',
  type: 'APPOINTMENT',
  children: [{ id: 'c1', firstName: 'Léa' }],
  allDay: false,
  date: '2026-11-12',
  startTime: '17:00:00',
  endTime: '17:45:00',
  location: null,
  reminder: 'DAY_BEFORE',
  visibility: 'SHARED',
  authorFirstName: 'Camille',
  mine: true,
  repeat: null,
  createdAt: '2026-11-01T10:00:00Z',
  updatedAt: '2026-11-01T10:00:00Z',
};
const PERSONNEL: CalendarEvent = {
  ...ORTHOPHONISTE,
  id: 'e2',
  title: 'Rendez-vous personnel',
  date: '2026-11-24',
  startTime: '09:30:00',
  endTime: '10:00:00',
  visibility: 'PRIVATE',
};

beforeEach(async () => {
  jest.useFakeTimers({ now: NOW });
  navigate.mockReset();
  eventApi.list.mockReset().mockResolvedValue([]);
  familyApi.fetchMyFamily.mockResolvedValue(TWO_PARENTS);
  familyApi.custody
    .mockReset()
    .mockImplementation(async (_id, from, to) => custody(from, to));
  await useSession.getState().signIn(authResponse());
});

afterEach(() => {
  jest.useRealTimers();
});

test('vue mois : chez qui, les passages, aujourd’hui et la légende', async () => {
  await renderScreen();
  expect(
    await screen.findByLabelText("Aujourd'hui, mardi 10 novembre, chez Julien"),
  ).toBeOnTheScreen();
  expect(
    screen.getByRole('header', { name: 'novembre 2026' }),
  ).toBeOnTheScreen();
  expect(
    screen.getByLabelText(
      'vendredi 13 novembre, passage de garde de Julien à Camille à 17 h 50',
    ),
  ).toBeOnTheScreen();
  expect(
    screen.getByLabelText('samedi 14 novembre, chez Camille'),
  ).toBeOnTheScreen();
  expect(screen.getAllByText('J›C')).toHaveLength(2); // 13 et 27 novembre
  expect(screen.getAllByText('C›J')).toHaveLength(2); // 6 et 20 novembre
  expect(screen.getByRole('button', { name: 'Mois' })).toBeSelected();
  // Grille de 6 semaines, du lundi 26 octobre au dimanche 6 décembre
  expect(familyApi.custody).toHaveBeenCalledWith(
    TWO_PARENTS.id,
    '2026-10-26',
    '2026-12-06',
  );
  expect(screen.getByText('Camille')).toBeOnTheScreen();
  expect(screen.getByText('Julien')).toBeOnTheScreen();
  expect(screen.queryByText(/Rythme proposé/)).toBeNull();
});

test('à venir : les passages suivants', async () => {
  await renderScreen();
  expect(
    await screen.findByRole('header', { name: 'À venir' }),
  ).toBeOnTheScreen();
  expect(familyApi.custody).toHaveBeenCalledWith(
    TWO_PARENTS.id,
    '2026-11-10',
    '2027-01-09',
  );
  expect(
    screen.getAllByText(
      /^Passage de garde, (Julien vers Camille|Camille vers Julien)$/,
    ),
  ).toHaveLength(5);
  expect(screen.getByText('ven. 13 nov. · 17 h 50')).toBeOnTheScreen();
  expect(screen.getByText('ven. 11 déc. · 17 h 50')).toBeOnTheScreen();
});

test('événements : marques du mois, libellés et « À venir » mêlé', async () => {
  eventApi.list.mockResolvedValue([ORTHOPHONISTE, PERSONNEL]);
  await renderScreen();
  expect(
    await screen.findByLabelText(
      'jeudi 12 novembre, chez Julien, Orthophoniste, partagé',
    ),
  ).toBeOnTheScreen();
  expect(
    screen.getByLabelText(
      'mardi 24 novembre, chez Julien, Rendez-vous personnel, privé',
    ),
  ).toBeOnTheScreen();
  expect(eventApi.list).toHaveBeenCalledWith(
    TWO_PARENTS.id,
    '2026-10-26',
    '2026-12-06',
  );
  expect(screen.getByText('Partagé')).toBeOnTheScreen();
  expect(screen.getByText('Privé')).toBeOnTheScreen();

  // « À venir » : l'événement du 12 se glisse entre les passages, dans l'ordre
  const titles = screen
    .getAllByText(/^(Orthophoniste|Passage de garde, .*)$/)
    .map(node => node.props.children);
  expect(titles.slice(0, 2)).toEqual([
    'Orthophoniste',
    'Passage de garde, Julien vers Camille',
  ]);
  expect(
    screen.getByText('jeu. 12 nov. · 17 h 00 – 17 h 45 · Léa'),
  ).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: /^Orthophoniste/ }));
  expect(navigate).toHaveBeenCalledWith('EventDetail', {
    event: ORTHOPHONISTE,
  });
});

test('vue semaine : un événement par ligne, un appui ouvre le détail', async () => {
  eventApi.list.mockResolvedValue([ORTHOPHONISTE]);
  await renderScreen();
  await screen.findByRole('header', { name: 'novembre 2026' });
  await fireEvent.press(screen.getByRole('button', { name: 'Semaine' }));
  const line = await screen.findByText('17 h 00 – 17 h 45 · Orthophoniste');
  await fireEvent.press(line);
  expect(navigate).toHaveBeenCalledWith('EventDetail', {
    event: ORTHOPHONISTE,
  });
});

test('« + » ouvre un nouvel événement', async () => {
  await renderScreen();
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Ajouter un événement' }),
  );
  expect(navigate).toHaveBeenCalledWith('EventForm');
});

test('mois suivant puis précédent', async () => {
  await renderScreen();
  await screen.findByRole('header', { name: 'novembre 2026' });
  await fireEvent.press(screen.getByRole('button', { name: 'Mois suivant' }));
  expect(
    await screen.findByRole('header', { name: 'décembre 2026' }),
  ).toBeOnTheScreen();
  expect(familyApi.custody).toHaveBeenCalledWith(
    TWO_PARENTS.id,
    '2026-11-30',
    '2027-01-10',
  );
  expect(
    await screen.findByLabelText(
      'samedi 19 décembre, chez Julien, Vacances de Noël',
    ),
  ).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Mois précédent' }));
  expect(
    await screen.findByRole('header', { name: 'novembre 2026' }),
  ).toBeOnTheScreen();
});

test('vue semaine : un jour par ligne, l’heure du passage', async () => {
  await renderScreen();
  await screen.findByRole('header', { name: 'novembre 2026' });
  await fireEvent.press(screen.getByRole('button', { name: 'Semaine' }));
  expect(
    await screen.findByRole('header', { name: '9 – 15 novembre' }),
  ).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Semaine' })).toBeSelected();
  expect(
    await screen.findByText("Julien jusqu'à 17 h 50, puis Camille"),
  ).toBeOnTheScreen();
  expect(screen.getAllByText('Chez Julien')).toHaveLength(4);
  expect(screen.getAllByText('Chez Camille')).toHaveLength(2);

  await fireEvent.press(
    screen.getByRole('button', { name: 'Semaine suivante' }),
  );
  expect(
    await screen.findByRole('header', { name: '16 – 22 novembre' }),
  ).toBeOnTheScreen();
});

test('nuit échangée : « échange » lu, « Échange » en vue semaine ; « Demander un échange »', async () => {
  familyApi.custody.mockImplementation(async (_id, from, to) => {
    const base = custody(from, to);
    return {
      ...base,
      nights: base.nights.map(night =>
        night.date === '2026-11-14'
          ? {
              ...night,
              parent: 'PARENT_B' as const,
              period: 'EXCHANGE' as const,
            }
          : night,
      ),
    };
  });
  await renderScreen();
  expect(
    await screen.findByLabelText('samedi 14 novembre, chez Julien, échange'),
  ).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Semaine' }));
  expect(await screen.findByText('Échange')).toBeOnTheScreen();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Demander un échange' }),
  );
  expect(navigate).toHaveBeenCalledWith('ExchangeForm');
});

test('rythme proposé, en mode solo', async () => {
  familyApi.fetchMyFamily.mockResolvedValue(family({ solo: true }));
  familyApi.custody.mockImplementation(async (_id, from, to) => ({
    ...custody(from, to),
    scheduleStatus: 'PROPOSED',
  }));
  await renderScreen();
  expect(
    await screen.findByText(
      "Rythme proposé : l'autre parent le validera à son arrivée.",
    ),
  ).toBeOnTheScreen();
  expect(
    screen.queryByRole('button', { name: 'Demander un échange' }),
  ).toBeNull();
});

test('aucun rythme enregistré', async () => {
  familyApi.custody.mockRejectedValue(new ApiError(404));
  await renderScreen();
  expect(
    await screen.findByText("Aucun rythme de garde n'est encore enregistré."),
  ).toBeOnTheScreen();
});

test('erreur de chargement puis « Réessayer »', async () => {
  familyApi.custody.mockRejectedValueOnce(new ApiError(500));
  await renderScreen();
  expect(
    await screen.findByText(
      'Impossible de charger le calendrier. Vérifiez votre connexion.',
    ),
  ).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Réessayer' }));
  expect(
    await screen.findByLabelText("Aujourd'hui, mardi 10 novembre, chez Julien"),
  ).toBeOnTheScreen();
});

test('vue mois : un jour touché est détaillé sous la grille', async () => {
  eventApi.list.mockResolvedValue([ORTHOPHONISTE, PERSONNEL]);
  await renderScreen();
  const thursday = await screen.findByRole('button', {
    name: 'jeudi 12 novembre, chez Julien, Orthophoniste, partagé',
  });
  await screen.findByRole('header', { name: 'À venir' });

  await fireEvent.press(thursday);
  expect(thursday).toBeSelected();
  expect(
    screen.getByRole('header', { name: 'jeudi 12 novembre' }),
  ).toBeOnTheScreen();
  expect(screen.queryByRole('header', { name: 'À venir' })).toBeNull();
  expect(screen.getByText('Chez Julien')).toBeOnTheScreen();

  // L'événement s'ouvre, « + » crée un événement ce jour-là
  await fireEvent.press(screen.getByText('17 h 00 – 17 h 45 · Orthophoniste'));
  expect(navigate).toHaveBeenCalledWith('EventDetail', {
    event: ORTHOPHONISTE,
  });
  await fireEvent.press(
    screen.getByRole('button', {
      name: 'Ajouter un événement le jeudi 12 novembre',
    }),
  );
  expect(navigate).toHaveBeenCalledWith('EventForm', { date: '2026-11-12' });

  // Toucher le même jour referme le détail
  await fireEvent.press(thursday);
  expect(thursday).not.toBeSelected();
  expect(screen.getByRole('header', { name: 'À venir' })).toBeOnTheScreen();
});

test('vue mois : un jour sans événement, puis changer de mois efface le choix', async () => {
  await renderScreen();
  await fireEvent.press(
    await screen.findByRole('button', {
      name: 'mercredi 18 novembre, chez Camille',
    }),
  );
  expect(screen.getByText('Aucun événement ce jour-là.')).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'Mois suivant' }));
  await screen.findByRole('header', { name: 'décembre 2026' });
  await fireEvent.press(screen.getByRole('button', { name: 'Mois précédent' }));
  await screen.findByRole('header', { name: 'novembre 2026' });
  expect(screen.queryByText('Aucun événement ce jour-là.')).toBeNull();
  expect(
    await screen.findByRole('header', { name: 'À venir' }),
  ).toBeOnTheScreen();
});

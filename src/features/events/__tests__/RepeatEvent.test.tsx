import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { EventDetailScreen } from '../EventDetailScreen';
import { EventFormScreen } from '../EventFormScreen';
import type {
  CalendarEvent,
  Custody,
  EventChange,
  Family,
  RepeatPreviewDate,
} from '../../../api/types';
import { ApiError } from '../../../api/errors';
import { CustodyProvider } from '../../../context/CustodyContext';
import { EventsProvider } from '../../../context/EventsContext';
import { FamilyProvider } from '../../../context/FamilyContext';
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

/** Je suis Camille (A) ; Julien (B) ; Léa et Hugo. */
const FAMILY: Family = family({
  solo: false,
  members: [
    { userId: 'u1', firstName: 'Camille', role: 'PARENT_A' },
    { userId: 'u2', firstName: 'Julien', role: 'PARENT_B' },
  ],
  children: [
    { id: 'c1', firstName: 'Léa', birthDate: '2018-03-03' },
    { id: 'c2', firstName: 'Hugo', birthDate: '2020-05-12' },
  ],
});
const FAMILY_ID = FAMILY.id;

/** Séance du mercredi 25 novembre d'un judo répété chaque semaine chez Julien. */
const JUDO: CalendarEvent = {
  id: 'e1',
  title: 'Judo',
  type: 'ACTIVITY',
  children: [{ id: 'c2', firstName: 'Hugo' }],
  allDay: false,
  date: '2026-11-25',
  startTime: '17:00:00',
  endTime: '18:00:00',
  location: null,
  reminder: 'NONE',
  visibility: 'SHARED',
  authorFirstName: 'Camille',
  mine: true,
  repeat: {
    frequency: 'WEEKLY',
    interval: null,
    unit: null,
    monthMode: null,
    days: [],
    onlyWith: 'PARENT_B',
    skipHolidays: true,
    end: 'SCHOOL_YEAR',
    count: null,
    firstDate: '2026-11-18',
    until: '2027-07-02',
  },
  createdAt: '2026-11-01T10:00:00Z',
  updatedAt: '2026-11-01T10:00:00Z',
};

/** Vendredis : chez Julien une semaine sur deux, Noël en vacances. */
const PREVIEW: RepeatPreviewDate[] = [
  { date: '2026-11-20', parent: 'PARENT_B', skipped: null },
  { date: '2026-11-27', parent: 'PARENT_A', skipped: 'OTHER_PARENT' },
  { date: '2026-12-04', parent: 'PARENT_B', skipped: null },
  { date: '2026-12-25', parent: 'PARENT_A', skipped: 'HOLIDAYS' },
];

const goBack = jest.fn();
const popTo = jest.fn();
const navigate = jest.fn();

async function renderForm(
  params: React.ComponentProps<typeof EventFormScreen>['route']['params'],
) {
  const props = {
    navigation: { goBack, popTo, navigate },
    route: { key: 'EventForm', name: 'EventForm', params },
  } as unknown as React.ComponentProps<typeof EventFormScreen>;
  await renderWithProviders(
    <FamilyProvider>
      <EventsProvider>
        <EventFormScreen {...props} />
      </EventsProvider>
    </FamilyProvider>,
  );
}

async function renderDetail(event: CalendarEvent) {
  const props = {
    navigation: { goBack, navigate },
    route: { key: 'EventDetail', name: 'EventDetail', params: { event } },
  } as unknown as React.ComponentProps<typeof EventDetailScreen>;
  await renderWithProviders(
    <FamilyProvider>
      <CustodyProvider>
        <EventsProvider>
          <EventDetailScreen {...props} />
        </EventsProvider>
      </CustodyProvider>
    </FamilyProvider>,
  );
  await screen.findByRole('header', { name: event.title });
}

beforeEach(async () => {
  jest.useFakeTimers({ now: NOW });
  goBack.mockReset();
  popTo.mockReset();
  navigate.mockReset();
  eventApi.create.mockReset();
  eventApi.update.mockReset();
  eventApi.remove.mockReset();
  eventApi.repeatPreview.mockReset().mockResolvedValue(PREVIEW);
  eventApi.history.mockReset();
  // Sans rythme par défaut : pas de « Ce jour-là »
  familyApi.custody.mockReset().mockRejectedValue(new ApiError(404));
  familyApi.fetchMyFamily.mockResolvedValue(FAMILY);
  await useSession.getState().signIn(authResponse());
});

afterEach(() => {
  jest.useRealTimers();
});

test('« Répéter » : suggestion de suivre la garde, fin, aperçu, puis le corps envoyé', async () => {
  eventApi.create.mockResolvedValue(JUDO);
  await renderForm({ date: '2026-11-20' });
  await fireEvent.changeText(await screen.findByLabelText('Titre'), 'Judo');
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Hugo' }));
  await fireEvent.press(screen.getByRole('button', { name: /^Répéter/ }));
  expect(screen.getByRole('header', { name: 'Répéter' })).toBeOnTheScreen();
  expect(screen.getByText('Judo · ven. 20 nov., 9 h 00')).toBeOnTheScreen();

  // Toutes les deux semaines sans filtre : l'app propose de suivre la garde
  await fireEvent.press(
    screen.getByRole('radio', {
      name: 'Toutes les deux semaines, le vendredi',
    }),
  );
  expect(
    await screen.findByText(/seulement quand Hugo est chez Julien/),
  ).toBeOnTheScreen();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Utiliser ce réglage' }),
  );
  expect(
    screen.getByRole('radio', { name: 'Chaque semaine, le vendredi' }),
  ).toBeChecked();
  expect(screen.getByRole('radio', { name: 'Julien' })).toBeChecked();
  expect(
    screen.getByRole('switch', { name: 'Pas pendant les vacances scolaires' }),
  ).toBeChecked();

  // Aperçu calculé par le serveur : dates prévues ou barrées, et pourquoi
  expect(
    await screen.findByLabelText('ven. 27 nov., non prévu, chez Camille'),
  ).toBeOnTheScreen();
  expect(
    screen.getByLabelText('ven. 25 déc., non prévu, vacances scolaires'),
  ).toBeOnTheScreen();
  expect(
    screen.getByLabelText('ven. 20 nov., prévu, chez Julien'),
  ).toBeOnTheScreen();
  await waitFor(() =>
    expect(eventApi.repeatPreview).toHaveBeenLastCalledWith(FAMILY_ID, {
      date: '2026-11-20',
      repeat: {
        frequency: 'WEEKLY',
        interval: null,
        unit: null,
        monthMode: null,
        days: [],
        onlyWith: 'PARENT_B',
        skipHolidays: true,
        end: 'SCHOOL_YEAR',
        count: null,
      },
    }),
  );

  await fireEvent.press(screen.getByRole('radio', { name: 'Nombre' }));
  await fireEvent.press(
    screen.getByRole('button', { name: 'Une séance de plus' }),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'OK' }));

  expect(
    screen.getByText(
      'Chaque semaine, le vendredi, seulement quand Hugo est chez Julien · hors vacances · 11 séances',
    ),
  ).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Enregistrer' }));
  await waitFor(() => expect(goBack).toHaveBeenCalled());
  expect(eventApi.create).toHaveBeenCalledWith(
    FAMILY_ID,
    expect.objectContaining({
      title: 'Judo',
      date: '2026-11-20',
      repeat: {
        frequency: 'WEEKLY',
        interval: null,
        unit: null,
        monthMode: null,
        days: [],
        onlyWith: 'PARENT_B',
        skipHolidays: true,
        end: 'COUNT',
        count: 11,
      },
    }),
  );
});

test('« Répéter » puis retour : rien ne change', async () => {
  await renderForm({ date: '2026-11-20' });
  await fireEvent.press(
    await screen.findByRole('button', { name: /^Répéter/ }),
  );
  await fireEvent.press(screen.getByRole('radio', { name: 'Chaque jour' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Retour' }));
  expect(
    screen.getByRole('button', { name: /^Répéter Jamais/ }),
  ).toBeOnTheScreen();
});

test('séance d’une série, « cet événement seulement » : sans « Répéter », portée envoyée', async () => {
  eventApi.update.mockResolvedValue({ ...JUDO, id: 'e2', repeat: null });
  await renderForm({ event: JUDO, scope: 'ONE' });
  await screen.findByRole('header', { name: "Modifier l'événement" });
  expect(screen.queryByRole('button', { name: /^Répéter/ })).toBeNull();

  await fireEvent.press(screen.getByRole('button', { name: 'Enregistrer' }));
  await waitFor(() => expect(popTo).toHaveBeenCalled());
  expect(eventApi.update).toHaveBeenCalledWith(
    FAMILY_ID,
    'e1',
    expect.objectContaining({ repeat: null, date: '2026-11-25' }),
    'ONE',
    '2026-11-25',
  );
});

test('détail d’une séance : la règle, puis « Modifier » demande quelles séances', async () => {
  await renderDetail(JUDO);
  expect(
    screen.getByText(
      'Chaque semaine, le mercredi, seulement quand Hugo est chez Julien · hors vacances · jusqu’au ven. 2 juil.'.replace(
        '’',
        "'",
      ),
    ),
  ).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'Modifier' }));
  expect(
    screen.getByRole('header', { name: 'Modifier quelles séances ?' }),
  ).toBeOnTheScreen();
  expect(navigate).not.toHaveBeenCalled();
  await fireEvent.press(
    screen.getByRole('radio', { name: /^Celui-ci et les suivants/ }),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Continuer' }));
  expect(navigate).toHaveBeenCalledWith('EventForm', {
    event: JUDO,
    scope: 'FOLLOWING',
  });
});

test('supprimer une séance seulement', async () => {
  eventApi.remove.mockResolvedValue(undefined);
  await renderDetail(JUDO);
  await fireEvent.press(
    screen.getByRole('button', { name: "Supprimer l'événement" }),
  );
  expect(
    screen.getByRole('header', { name: 'Supprimer quelles séances ?' }),
  ).toBeOnTheScreen();
  expect(
    screen.getByRole('radio', { name: /^Cet événement seulement/ }),
  ).toBeChecked();
  await fireEvent.press(screen.getByRole('button', { name: 'Supprimer' }));
  await waitFor(() => expect(goBack).toHaveBeenCalled());
  expect(eventApi.remove).toHaveBeenCalledWith(
    FAMILY_ID,
    'e1',
    'ONE',
    '2026-11-25',
  );
});

test('séance passée : seule « Toute la série » (les séances à venir) est proposée', async () => {
  await renderDetail({ ...JUDO, date: '2026-11-04' });
  await fireEvent.press(screen.getByRole('button', { name: 'Modifier' }));
  expect(screen.getAllByRole('radio')).toHaveLength(1);
  expect(screen.getByRole('radio', { name: /^Toute la série/ })).toBeChecked();
});

/** Choisit une heure dans le champ `label` (sélecteur iOS), puis « OK » de la feuille. */
async function pickTime(label: RegExp, hours: number, minutes: number) {
  await fireEvent.press(screen.getByRole('button', { name: label }));
  await fireEvent(
    screen.getByTestId('time-picker'),
    'change',
    { type: 'set' },
    new Date(2000, 0, 1, hours, minutes),
  );
  const ok = screen.getAllByRole('button', { name: 'OK' });
  await fireEvent.press(ok[ok.length - 1]);
}

test('« Personnalisé » : toutes les 2 semaines, lundi et vendredi, chacun son horaire', async () => {
  eventApi.create.mockResolvedValue(JUDO);
  await renderForm({ date: '2026-11-20' });
  await fireEvent.changeText(await screen.findByLabelText('Titre'), 'Judo');
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Hugo' }));
  await fireEvent.press(screen.getByRole('button', { name: /^Répéter/ }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Personnalisé' }));
  expect(
    screen.getByRole('header', { name: 'Personnalisé' }),
  ).toBeOnTheScreen();

  // Le jour de l'événement reste choisi
  const friday = screen.getByRole('checkbox', {
    name: "vendredi, jour de l'événement",
  });
  expect(friday).toBeChecked();
  await fireEvent.press(friday);
  expect(friday).toBeChecked();

  await fireEvent.press(screen.getByRole('button', { name: 'Augmenter' }));
  await fireEvent.press(screen.getByRole('checkbox', { name: 'lundi' }));
  const sameTime = screen.getByRole('switch', {
    name: 'Même horaire chaque jour',
  });
  expect(sameTime).toBeChecked();
  await fireEvent.press(sameTime);
  expect(
    screen.getByText("9 h 00 – 10 h 00 (horaire de l'événement)"),
  ).toBeOnTheScreen();

  // Lundi 17 h 30 : la fin (10 h) précède le début, refusé jusqu'à 18 h 30
  await pickTime(/^Début, lundi/, 17, 30);
  await fireEvent.press(screen.getAllByRole('button', { name: 'OK' })[0]);
  expect(
    screen.getByText(
      "L'heure de fin doit suivre l'heure de début, chaque jour.",
    ),
  ).toBeOnTheScreen();
  await pickTime(/^Fin, lundi/, 18, 30);
  await fireEvent.press(screen.getByRole('button', { name: 'OK' }));

  // Retour dans « Répéter » : la règle sous « Personnalisé », et l'aperçu la suit
  expect(screen.getByRole('radio', { name: /^Personnalisé/ })).toBeChecked();
  const label =
    'Toutes les 2 semaines, le lundi à 17 h 30 et le vendredi à 9 h 00';
  expect(screen.getByText(label)).toBeOnTheScreen();
  const repeat = {
    frequency: 'CUSTOM',
    interval: 2,
    unit: 'WEEK',
    monthMode: null,
    days: [
      { dayOfWeek: 'MONDAY', startTime: '17:30', endTime: '18:30' },
      { dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '10:00' },
    ],
    onlyWith: null,
    skipHolidays: true,
    end: 'SCHOOL_YEAR',
    count: null,
  };
  await waitFor(() =>
    expect(eventApi.repeatPreview).toHaveBeenLastCalledWith(FAMILY_ID, {
      date: '2026-11-20',
      repeat,
    }),
  );

  await fireEvent.press(screen.getByRole('button', { name: 'OK' }));
  expect(screen.getByText(`${label} · hors vacances`)).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Enregistrer' }));
  await waitFor(() => expect(goBack).toHaveBeenCalled());
  expect(eventApi.create).toHaveBeenCalledWith(
    FAMILY_ID,
    expect.objectContaining({ date: '2026-11-20', repeat }),
  );
});

test('« Personnalisé » par mois : le même rang du jour', async () => {
  await renderForm({ date: '2026-11-20' });
  await fireEvent.press(
    await screen.findByRole('button', { name: /^Répéter/ }),
  );
  await fireEvent.press(screen.getByRole('radio', { name: 'Personnalisé' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'mois' }));
  expect(
    screen.getByRole('radio', { name: 'Le 20 de chaque mois' }),
  ).toBeChecked();
  await fireEvent.press(
    screen.getByRole('radio', { name: 'Le troisième vendredi du mois' }),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'OK' }));
  expect(
    screen.getByText('Chaque mois, le troisième vendredi'),
  ).toBeOnTheScreen();

  // Retour depuis « Personnalisé » : rien ne change
  await fireEvent.press(screen.getByRole('radio', { name: /^Personnalisé/ }));
  await fireEvent.press(screen.getByRole('radio', { name: 'jours' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Retour' }));
  expect(
    screen.getByText('Chaque mois, le troisième vendredi'),
  ).toBeOnTheScreen();
});

test('détail : l’historique de la série, du plus récent au plus ancien', async () => {
  const history: EventChange[] = [
    {
      id: 'h3',
      action: 'DELETED',
      scope: 'ONE',
      occurrenceDate: '2026-12-02',
      fields: [],
      authorFirstName: 'Julien',
      mine: false,
      createdAt: '2026-11-12T17:04:00Z',
    },
    {
      id: 'h2',
      action: 'UPDATED',
      scope: 'FOLLOWING',
      occurrenceDate: '2026-11-25',
      fields: ['TIME', 'LOCATION'],
      authorFirstName: 'Julien',
      mine: false,
      createdAt: '2026-11-12T17:00:00Z',
    },
    {
      id: 'h1',
      action: 'CREATED',
      scope: null,
      occurrenceDate: null,
      fields: [],
      authorFirstName: 'Camille',
      mine: true,
      createdAt: '2026-11-01T10:00:00Z',
    },
  ];
  eventApi.history.mockResolvedValue(history);
  await renderDetail(JUDO);
  expect(screen.getByRole('header', { name: 'Historique' })).toBeOnTheScreen();
  expect(
    await screen.findByText('Julien a supprimé la séance du mer. 2 déc.'),
  ).toBeOnTheScreen();
  expect(
    screen.getByText("Julien a modifié l'heure et le lieu"),
  ).toBeOnTheScreen();
  expect(
    screen.getByText('à partir du mer. 25 nov. · 12 novembre à 18 h 00'),
  ).toBeOnTheScreen();
  expect(screen.getByText("Vous avez créé l'événement")).toBeOnTheScreen();
  expect(eventApi.history).toHaveBeenCalledWith(FAMILY_ID, 'e1');
});

/** Garde d'un seul jour : la nuit chez `parent`, avec un passage de garde si `handover`. */
function dayCustody(
  date: string,
  parent: Custody['nights'][number]['parent'],
  handover: boolean,
): Custody {
  return {
    scheduleStatus: 'ACTIVE',
    nights: [{ date, parent, period: 'REGULAR', holiday: null }],
    handovers: handover
      ? [{ at: `${date}T17:50:00`, from: 'PARENT_A', to: parent }]
      : [],
    nextHandover: null,
  };
}

test('détail : « Ce jour-là », chez qui sont les enfants', async () => {
  familyApi.custody.mockImplementation(async (_id, from) =>
    dayCustody(from, 'PARENT_B', false),
  );
  await renderDetail(JUDO);
  expect(await screen.findByText('Hugo est chez Julien')).toBeOnTheScreen();
  expect(screen.getByText('Ce jour-là')).toBeOnTheScreen();
  expect(familyApi.custody).toHaveBeenCalledWith(
    FAMILY_ID,
    '2026-11-25',
    '2026-11-25',
  );
});

test('détail : « Ce jour-là », un jour de passage de garde', async () => {
  familyApi.custody.mockImplementation(async (_id, from) =>
    dayCustody(from, 'PARENT_B', true),
  );
  await renderDetail(JUDO);
  expect(
    await screen.findByText('Passage de Camille à Julien à 17 h 50'),
  ).toBeOnTheScreen();
});

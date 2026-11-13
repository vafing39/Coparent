import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { EventFormScreen } from '../EventFormScreen';
import { ApiError } from '../../../api/errors';
import type { CalendarEvent, Family } from '../../../api/types';
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

const TWO_CHILDREN: Family = family({
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
const FAMILY_ID = TWO_CHILDREN.id;

const JUDO: CalendarEvent = {
  id: 'e1',
  title: 'Judo',
  type: 'ACTIVITY',
  children: [{ id: 'c2', firstName: 'Hugo' }],
  allDay: false,
  date: '2026-11-18',
  startTime: '14:00:00',
  endTime: '15:30:00',
  location: 'Gymnase',
  reminder: 'DAY_BEFORE',
  visibility: 'SHARED',
  authorFirstName: 'Julien',
  mine: false,
  repeat: null,
  createdAt: '2026-11-01T10:00:00Z',
  updatedAt: '2026-11-01T10:00:00Z',
};

const goBack = jest.fn();
const popTo = jest.fn();

async function renderScreen(params?: { event?: CalendarEvent; date?: string }) {
  const props = {
    navigation: { goBack, popTo },
    route: { key: 'EventForm', name: 'EventForm', params },
  } as unknown as React.ComponentProps<typeof EventFormScreen>;
  await renderWithProviders(
    <FamilyProvider>
      <EventsProvider>
        <EventFormScreen {...props} />
      </EventsProvider>
    </FamilyProvider>,
  );
  await screen.findByRole('header', {
    name: params?.event ? "Modifier l'événement" : 'Nouvel événement',
  });
}

const save = () =>
  fireEvent.press(screen.getByRole('button', { name: 'Enregistrer' }));

/** Choisit une heure dans le sélecteur iOS (simulé) du champ `name`. */
async function pickTime(name: RegExp, hours: number, minutes: number) {
  await fireEvent.press(screen.getByRole('button', { name }));
  await fireEvent(
    screen.getByTestId('time-picker'),
    'onChange',
    { type: 'set' },
    new Date(2000, 0, 1, hours, minutes),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'OK' }));
}

beforeEach(async () => {
  jest.useFakeTimers({ now: NOW });
  goBack.mockReset();
  popTo.mockReset();
  eventApi.create.mockReset();
  eventApi.update.mockReset();
  familyApi.fetchMyFamily.mockResolvedValue(TWO_CHILDREN);
  await useSession.getState().signIn(authResponse());
});

afterEach(() => {
  jest.useRealTimers();
});

test('création : le corps envoyé, puis retour', async () => {
  eventApi.create.mockResolvedValue({ ...JUDO, id: 'e2' });
  await renderScreen({ date: '2026-11-20' });

  await fireEvent.changeText(screen.getByLabelText('Titre'), 'Orthophoniste');
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Léa' }));
  await pickTime(/^Début/, 17, 0);
  await pickTime(/^Fin/, 17, 45);
  await fireEvent.changeText(screen.getByLabelText('Lieu'), 'Cabinet');
  await fireEvent.press(screen.getByRole('radio', { name: 'La veille' }));
  await save();

  expect(eventApi.create).toHaveBeenCalledWith(FAMILY_ID, {
    title: 'Orthophoniste',
    type: 'APPOINTMENT',
    childIds: ['c1'],
    date: '2026-11-20',
    allDay: false,
    startTime: '17:00',
    endTime: '17:45',
    location: 'Cabinet',
    reminder: 'DAY_BEFORE',
    visibility: 'SHARED',
    repeat: null,
  });
  expect(goBack).toHaveBeenCalled();
});

test('toute la journée, privé : sans heures, aujourd’hui par défaut', async () => {
  eventApi.create.mockResolvedValue(JUDO);
  await renderScreen();

  await fireEvent.changeText(screen.getByLabelText('Titre'), 'Sortie');
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Hugo' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'École' }));
  await fireEvent.press(
    screen.getByRole('switch', { name: 'Toute la journée' }),
  );
  expect(screen.queryByRole('button', { name: /^Début/ })).toBeNull();
  expect(
    screen.getByText('Partagé : les deux parents le voient.'),
  ).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('radio', { name: 'Privé' }));
  expect(screen.getByText(/^Privé : vous seul le voyez/)).toBeOnTheScreen();
  await save();

  expect(eventApi.create).toHaveBeenCalledWith(FAMILY_ID, {
    title: 'Sortie',
    type: 'SCHOOL',
    childIds: ['c2'],
    date: '2026-11-10',
    allDay: true,
    startTime: null,
    endTime: null,
    location: null,
    reminder: 'NONE',
    visibility: 'PRIVATE',
    repeat: null,
  });
});

test('erreurs : titre vide, aucun enfant, fin avant le début', async () => {
  await renderScreen();
  await pickTime(/^Fin/, 8, 30);
  await save();

  expect(await screen.findByText('Saisissez un titre.')).toBeOnTheScreen();
  expect(screen.getByText('Choisissez au moins un enfant.')).toBeOnTheScreen();
  expect(
    screen.getByText("L'heure de fin doit suivre l'heure de début."),
  ).toBeOnTheScreen();
  expect(eventApi.create).not.toHaveBeenCalled();
});

test('erreur du serveur affichée', async () => {
  eventApi.create.mockRejectedValue(new ApiError(400));
  await renderScreen();
  await fireEvent.changeText(screen.getByLabelText('Titre'), 'Judo');
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Hugo' }));
  await save();
  expect(
    await screen.findByText("Vérifiez les informations de l'événement."),
  ).toBeOnTheScreen();
  expect(goBack).not.toHaveBeenCalled();
});

test('modification : champs pré-remplis, puis retour au détail', async () => {
  const updated = { ...JUDO, title: 'Judo (compétition)' };
  eventApi.update.mockResolvedValue(updated);
  await renderScreen({ event: JUDO });

  expect(screen.getByLabelText('Titre')).toHaveDisplayValue('Judo');
  expect(screen.getByRole('checkbox', { name: 'Hugo' })).toBeChecked();
  expect(screen.getByRole('checkbox', { name: 'Léa' })).not.toBeChecked();
  expect(screen.getByRole('radio', { name: 'Activité' })).toBeChecked();
  expect(
    screen.getByRole('button', { name: 'Début : 14 h 00' }),
  ).toBeOnTheScreen();
  expect(screen.getByLabelText('Lieu')).toHaveDisplayValue('Gymnase');

  await fireEvent.changeText(
    screen.getByLabelText('Titre'),
    'Judo (compétition)',
  );
  await save();

  expect(eventApi.update).toHaveBeenCalledWith(FAMILY_ID, 'e1', {
    title: 'Judo (compétition)',
    type: 'ACTIVITY',
    childIds: ['c2'],
    date: '2026-11-18',
    allDay: false,
    startTime: '14:00',
    endTime: '15:30',
    location: 'Gymnase',
    reminder: 'DAY_BEFORE',
    visibility: 'SHARED',
    repeat: null,
  });
  expect(popTo).toHaveBeenCalledWith('EventDetail', { event: updated });
});

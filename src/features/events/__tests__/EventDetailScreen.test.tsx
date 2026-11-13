import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { EventDetailScreen } from '../EventDetailScreen';
import { ApiError } from '../../../api/errors';
import type { CalendarEvent, Family } from '../../../api/types';
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

const DENTISTE: CalendarEvent = {
  id: 'e1',
  title: 'Dentiste',
  type: 'APPOINTMENT',
  children: [
    { id: 'c1', firstName: 'Léa' },
    { id: 'c2', firstName: 'Hugo' },
  ],
  allDay: false,
  date: '2026-11-18',
  startTime: '14:00:00',
  endTime: '14:30:00',
  location: 'Cabinet Martin',
  reminder: 'DAY_BEFORE',
  visibility: 'SHARED',
  authorFirstName: 'Julien',
  mine: false,
  repeat: null,
  createdAt: '2026-11-10T10:00:00Z',
  updatedAt: '2026-11-10T10:00:00Z',
};

const goBack = jest.fn();
const navigate = jest.fn();

async function renderScreen(event: CalendarEvent) {
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
  // Sans rythme par défaut : pas de « Ce jour-là »
  familyApi.custody.mockReset().mockRejectedValue(new ApiError(404));
  goBack.mockReset();
  navigate.mockReset();
  eventApi.remove.mockReset();
  familyApi.fetchMyFamily.mockResolvedValue(FAMILY);
  await useSession.getState().signIn(authResponse());
});

test('affichage d’un événement partagé de l’autre parent', async () => {
  await renderScreen(DENTISTE);
  expect(screen.getByText('Rendez-vous · partagé')).toBeOnTheScreen();
  expect(screen.getByText(/14 h 00 – 14 h 30$/)).toBeOnTheScreen();
  expect(screen.getByText('Enfants concernés')).toBeOnTheScreen();
  expect(screen.getByText('Léa et Hugo')).toBeOnTheScreen();
  expect(screen.getByText('Cabinet Martin')).toBeOnTheScreen();
  expect(screen.getByText('La veille')).toBeOnTheScreen();
  expect(screen.getByText(/^Ajouté par Julien le 10 nov/)).toBeOnTheScreen();
});

test('événement privé à moi, sans lieu, journée entière', async () => {
  await renderScreen({
    ...DENTISTE,
    title: 'Rendez-vous personnel',
    children: [{ id: 'c1', firstName: 'Léa' }],
    allDay: true,
    startTime: null,
    endTime: null,
    location: null,
    visibility: 'PRIVATE',
    authorFirstName: 'Camille',
    mine: true,
    repeat: null,
  });
  expect(screen.getByText('Rendez-vous · privé')).toBeOnTheScreen();
  expect(screen.getByText(/Toute la journée$/)).toBeOnTheScreen();
  expect(screen.getByText('Enfant concerné')).toBeOnTheScreen();
  expect(screen.queryByText('Lieu')).toBeNull();
  expect(screen.getByText(/^Ajouté par vous le/)).toBeOnTheScreen();
});

test('« Modifier » ouvre le formulaire', async () => {
  await renderScreen(DENTISTE);
  await fireEvent.press(screen.getByRole('button', { name: 'Modifier' }));
  expect(navigate).toHaveBeenCalledWith('EventForm', { event: DENTISTE });
});

test('suppression après confirmation, puis retour', async () => {
  const alert = jest.spyOn(Alert, 'alert');
  eventApi.remove.mockResolvedValue(undefined);
  await renderScreen(DENTISTE);

  await fireEvent.press(
    screen.getByRole('button', { name: "Supprimer l'événement" }),
  );
  expect(alert.mock.calls[0][0]).toBe('Supprimer « Dentiste » ?');
  const buttons = alert.mock.calls[0][2] ?? [];
  expect(eventApi.remove).not.toHaveBeenCalled();
  await act(async () => {
    buttons.find(b => b.text === 'Supprimer')?.onPress?.();
  });

  expect(eventApi.remove).toHaveBeenCalledWith(FAMILY.id, 'e1');
  await waitFor(() => expect(goBack).toHaveBeenCalled());
  alert.mockRestore();
});

test('suppression refusée : l’erreur s’affiche', async () => {
  const alert = jest.spyOn(Alert, 'alert');
  eventApi.remove.mockRejectedValue(new ApiError(404));
  await renderScreen(DENTISTE);
  await fireEvent.press(
    screen.getByRole('button', { name: "Supprimer l'événement" }),
  );
  await act(async () => {
    alert.mock.calls[0][2]?.find(b => b.text === 'Supprimer')?.onPress?.();
  });
  expect(
    await screen.findByText("Cet événement n'existe plus."),
  ).toBeOnTheScreen();
  expect(goBack).not.toHaveBeenCalled();
  alert.mockRestore();
});

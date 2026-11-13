import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { MessagesScreen } from '../MessagesScreen';
import { ApiError } from '../../../api/errors';
import type { Conversation, Family, Message } from '../../../api/types';
import { FamilyProvider } from '../../../context/FamilyContext';
import { MessagesProvider } from '../../../context/MessagesContext';
import { useSession } from '../../../stores/session';
import { authResponse } from '../../../test-utils/authFixtures';
import { familyApi, messageApi } from '../../../test-utils/fakeApiClient';
import { family } from '../../../test-utils/familyFixtures';
import { realtime } from '../../../test-utils/fakeRealtime';
import { renderWithProviders } from '../../../test-utils/render';

jest.mock('../../../api/client', () =>
  jest.requireActual('../../../test-utils/fakeApiClient'),
);

/** Vendredi 13 novembre 2026, 14 h 30 à Paris. */
const NOW = new Date('2026-11-13T13:30:00Z');

const ME = '0c3b6a2e-0000-0000-0000-000000000001';
const JULIEN = '0c3b6a2e-0000-0000-0000-000000000002';

const TWO_PARENTS: Family = family({
  solo: false,
  members: [
    { userId: ME, firstName: 'Camille', role: 'PARENT_A' },
    { userId: JULIEN, firstName: 'Julien', role: 'PARENT_B' },
  ],
});

function message(overrides: Partial<Message>): Message {
  return {
    id: `m${overrides.seq}`,
    conversationId: 'c',
    seq: 1,
    senderId: JULIEN,
    senderFirstName: 'Julien',
    body: '',
    createdAt: '2026-11-13T10:00:00Z',
    readAt: null,
    ...overrides,
  };
}

const NOEL: Conversation = {
  id: 'conv-noel',
  subject: 'Vacances de Noël',
  authorFirstName: 'Julien',
  createdAt: '2026-11-10T09:00:00Z',
  lastMessage: message({
    seq: 5,
    conversationId: 'conv-noel',
    body: 'Je propose du 19 au 26.',
    createdAt: '2026-11-13T09:46:00Z', // aujourd'hui, 10 h 46
  }),
  unreadCount: 2,
};
const KIMONO: Conversation = {
  id: 'conv-kimono',
  subject: 'Kimono de Hugo',
  authorFirstName: 'Camille',
  createdAt: '2026-11-12T17:00:00Z',
  lastMessage: message({
    seq: 3,
    conversationId: 'conv-kimono',
    senderId: ME,
    senderFirstName: 'Camille',
    body: 'Merci, je préviens la maîtresse.',
    createdAt: '2026-11-12T17:20:00Z', // hier
  }),
  unreadCount: 0,
};

const navigate = jest.fn();
const props = {
  navigation: { navigate },
  route: { key: 'Messages', name: 'Messages' },
} as unknown as React.ComponentProps<typeof MessagesScreen>;

async function renderScreen() {
  await renderWithProviders(
    <FamilyProvider>
      <MessagesProvider>
        <MessagesScreen {...props} />
      </MessagesProvider>
    </FamilyProvider>,
  );
}

beforeEach(async () => {
  jest.useFakeTimers({ now: NOW });
  navigate.mockReset();
  familyApi.fetchMyFamily.mockResolvedValue(TWO_PARENTS);
  messageApi.conversations.mockReset().mockResolvedValue([NOEL, KIMONO]);
  await useSession.getState().signIn(authResponse());
});

afterEach(() => {
  jest.useRealTimers();
});

test('liste : sujet, dernier message, heure, non-lus ; un appui ouvre la discussion', async () => {
  await renderScreen();
  const noel = await screen.findByRole('button', {
    name: 'Vacances de Noël. Je propose du 19 au 26.. 10 h 46. 2 messages non lus',
  });
  expect(noel).toBeOnTheScreen();
  expect(
    screen.getByRole('button', {
      name: 'Kimono de Hugo. Vous : Merci, je préviens la maîtresse.. Hier',
    }),
  ).toBeOnTheScreen();
  expect(screen.getByText('2')).toBeOnTheScreen();
  const subjects = screen
    .getAllByText(/^(Bienvenue|Vacances de Noël|Kimono de Hugo)$/)
    .map(node => node.props.children);
  expect(subjects).toEqual(['Bienvenue', 'Vacances de Noël', 'Kimono de Hugo']);

  await fireEvent.press(noel);
  expect(navigate).toHaveBeenCalledWith('Conversation', {
    conversationId: 'conv-noel',
    subject: 'Vacances de Noël',
  });
});

test('« Bienvenue » épinglée en tête ouvre le message de Coparent', async () => {
  await renderScreen();
  await screen.findByText('Vacances de Noël');
  await fireEvent.press(
    screen.getByRole('button', {
      name: 'Bienvenue, message de Coparent, épinglé. Une discussion par sujet, des messages datés et conservés.',
    }),
  );
  expect(navigate).toHaveBeenCalledWith('Welcome');
});

test('« + » ouvre une nouvelle discussion', async () => {
  await renderScreen();
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Nouvelle discussion' }),
  );
  expect(navigate).toHaveBeenCalledWith('NewConversation');
});

test('un message reçu en temps réel recharge la liste', async () => {
  await renderScreen();
  await screen.findByText('Vacances de Noël');
  messageApi.conversations.mockResolvedValue([
    {
      ...KIMONO,
      unreadCount: 1,
      lastMessage: message({
        seq: 6,
        conversationId: 'conv-kimono',
        body: 'Bien reçu.',
      }),
    },
    NOEL,
  ]);
  await act(async () => {
    realtime.emit({
      type: 'MESSAGE',
      conversationId: 'conv-kimono',
      message: message({
        seq: 6,
        conversationId: 'conv-kimono',
        body: 'Bien reçu.',
      }),
    });
  });
  expect(await screen.findByText('Bien reçu.')).toBeOnTheScreen();
  await waitFor(() =>
    expect(
      screen
        .getAllByText(/^(Vacances de Noël|Kimono de Hugo)$/)
        .map(node => node.props.children),
    ).toEqual(['Kimono de Hugo', 'Vacances de Noël']),
  );
});

test('aucune discussion : seule « Bienvenue » est listée', async () => {
  messageApi.conversations.mockResolvedValue([]);
  await renderScreen();
  expect(
    await screen.findByRole('button', {
      name: 'Bienvenue, message de Coparent, épinglé. Une discussion par sujet, des messages datés et conservés.',
    }),
  ).toBeOnTheScreen();
  expect(screen.queryByText(/Aucune discussion/)).toBeNull();
});

test('erreur de chargement puis « Réessayer »', async () => {
  messageApi.conversations.mockRejectedValueOnce(new ApiError(500));
  await renderScreen();
  expect(
    await screen.findByText(
      'Impossible de charger les discussions. Vérifiez votre connexion.',
    ),
  ).toBeOnTheScreen();
  expect(
    screen.getByRole('button', {
      name: 'Bienvenue, message de Coparent, épinglé. Une discussion par sujet, des messages datés et conservés.',
    }),
  ).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Réessayer' }));
  expect(await screen.findByText('Vacances de Noël')).toBeOnTheScreen();
});

test('mode solo : la messagerie attend l’autre parent', async () => {
  familyApi.fetchMyFamily.mockResolvedValue(family({ solo: true }));
  await renderScreen();
  expect(
    await screen.findByText(
      "La messagerie s'ouvrira quand l'autre parent aura rejoint",
    ),
  ).toBeOnTheScreen();
  expect(messageApi.conversations).not.toHaveBeenCalled();
  expect(realtime.subscribedFamilies()).toEqual([]);
  expect(
    screen.queryByRole('button', { name: 'Nouvelle discussion' }),
  ).toBeNull();
  expect(screen.queryByText('Bienvenue')).toBeNull();
});

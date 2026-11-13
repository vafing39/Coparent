import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { MessagesScreen } from '../MessagesScreen';
import { ApiError } from '../../../api/errors';
import type { Family, Message } from '../../../api/types';
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
const FAMILY_ID = TWO_PARENTS.id;

function message(overrides: Partial<Message>): Message {
  return {
    id: `m${overrides.seq}`,
    seq: 1,
    senderId: JULIEN,
    senderFirstName: 'Julien',
    body: '',
    createdAt: '2026-11-13T10:00:00Z',
    readAt: null,
    ...overrides,
  };
}

const KIMONO = message({
  seq: 1,
  body: "Hugo a oublié son kimono chez moi, je le dépose à l'école demain matin.",
  createdAt: '2026-11-12T17:12:00Z', // hier, 18 h 12
  readAt: '2026-11-12T17:15:00Z',
});
const MERCI = message({
  seq: 2,
  senderId: ME,
  senderFirstName: 'Camille',
  body: 'Merci, je préviens la maîtresse.',
  createdAt: '2026-11-12T17:20:00Z',
  readAt: '2026-11-12T17:25:00Z', // lu à 18 h 25
});
const VENDREDI = message({
  seq: 3,
  body: 'Je les récupère à 18 h 30 vendredi.',
  createdAt: '2026-11-13T09:46:00Z', // aujourd'hui, 10 h 46
});

const goBack = jest.fn();
const props = {
  navigation: { isFocused: () => true, addListener: () => () => {}, goBack },
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

const input = () => screen.getByLabelText('Votre message à Julien');
const sendButton = () => screen.getByRole('button', { name: 'Envoyer' });

beforeEach(async () => {
  jest.useFakeTimers({ now: NOW });
  familyApi.fetchMyFamily.mockResolvedValue(TWO_PARENTS);
  messageApi.list
    .mockReset()
    .mockResolvedValue({ messages: [KIMONO, MERCI, VENDREDI], hasMore: false });
  messageApi.send.mockReset();
  messageApi.read.mockReset().mockResolvedValue(undefined);
  await useSession.getState().signIn(authResponse());
});

afterEach(() => {
  jest.useRealTimers();
});

test('conversation : jours, bulles, « Lu » avec l’heure, puis lecture signalée', async () => {
  await renderScreen();
  expect(await screen.findByText(KIMONO.body)).toBeOnTheScreen();
  expect(screen.getByRole('header', { name: 'Julien' })).toBeOnTheScreen();
  expect(
    screen.getByText('Messages conservés, non modifiables'),
  ).toBeOnTheScreen();
  expect(screen.getByRole('header', { name: 'Hier' })).toBeOnTheScreen();
  expect(screen.getByRole('header', { name: "Aujourd'hui" })).toBeOnTheScreen();
  expect(screen.getByText('Lu · 18 h 25')).toBeOnTheScreen();
  expect(screen.getByText('18 h 12')).toBeOnTheScreen();
  expect(
    screen.getByLabelText(
      'Vous, lu à 18 h 25 : Merci, je préviens la maîtresse.',
    ),
  ).toBeOnTheScreen();
  expect(messageApi.list).toHaveBeenCalledWith(FAMILY_ID, undefined);
  // Le message de Julien d'aujourd'hui n'était pas lu
  await waitFor(() =>
    expect(messageApi.read).toHaveBeenCalledWith(FAMILY_ID, 3),
  );
  expect(realtime.subscribedFamilies()).toEqual([FAMILY_ID]);

  // Sans barre d'onglets : la flèche ramène à l'onglet précédent
  await fireEvent.press(screen.getByRole('button', { name: 'Retour' }));
  expect(goBack).toHaveBeenCalled();
});

test('envoi : le message s’ajoute, « Envoyé », champ vidé', async () => {
  messageApi.send.mockResolvedValue(
    message({
      seq: 4,
      senderId: ME,
      senderFirstName: 'Camille',
      body: "D'accord pour 18 h 30.",
      createdAt: NOW.toISOString(),
    }),
  );
  await renderScreen();
  await screen.findByText(KIMONO.body);
  expect(sendButton()).toBeDisabled();

  await fireEvent.changeText(input(), "  D'accord pour 18 h 30.  ");
  await fireEvent.press(sendButton());

  expect(messageApi.send).toHaveBeenCalledWith(
    FAMILY_ID,
    "D'accord pour 18 h 30.",
  );
  expect(await screen.findByText("D'accord pour 18 h 30.")).toBeOnTheScreen();
  expect(screen.getByText('Envoyé · 14 h 30')).toBeOnTheScreen();
  expect(input()).toHaveDisplayValue('');
});

test('envoi impossible : erreur affichée, brouillon gardé', async () => {
  messageApi.send.mockRejectedValue(new ApiError(500));
  await renderScreen();
  await screen.findByText(KIMONO.body);
  await fireEvent.changeText(input(), 'Bonjour');
  await fireEvent.press(sendButton());
  expect(await screen.findByRole('alert')).toBeOnTheScreen();
  expect(input()).toHaveDisplayValue('Bonjour');
});

test('temps réel : un message reçu s’affiche, puis « Lu » arrive sur le mien', async () => {
  messageApi.list.mockResolvedValue({
    messages: [{ ...MERCI, readAt: null }],
    hasMore: false,
  });
  await renderScreen();
  expect(await screen.findByText('Envoyé · 18 h 20')).toBeOnTheScreen();

  await act(async () => {
    realtime.emit({
      type: 'READ',
      readerId: JULIEN,
      upToSeq: 2,
      readAt: '2026-11-13T13:00:00Z',
    });
  });
  expect(await screen.findByText('Lu · 14 h 00')).toBeOnTheScreen();

  await act(async () => {
    realtime.emit({
      type: 'MESSAGE',
      message: message({
        seq: 3,
        body: 'Parfait, merci.',
        createdAt: '2026-11-13T13:29:00Z',
      }),
    });
  });
  expect(await screen.findByText('Parfait, merci.')).toBeOnTheScreen();
  await waitFor(() =>
    expect(messageApi.read).toHaveBeenCalledWith(FAMILY_ID, 3),
  );
});

test('conversation vide', async () => {
  messageApi.list.mockResolvedValue({ messages: [], hasMore: false });
  await renderScreen();
  expect(
    await screen.findByText(
      "Aucun message pour l'instant. Écrivez à Julien : vos échanges sont conservés et datés.",
    ),
  ).toBeOnTheScreen();
  expect(messageApi.read).not.toHaveBeenCalled();
});

test('erreur de chargement puis « Réessayer »', async () => {
  messageApi.list.mockRejectedValueOnce(new ApiError(500));
  await renderScreen();
  expect(
    await screen.findByText(
      'Impossible de charger les messages. Vérifiez votre connexion.',
    ),
  ).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Réessayer' }));
  expect(await screen.findByText(KIMONO.body)).toBeOnTheScreen();
});

test('mode solo : la messagerie attend l’autre parent', async () => {
  familyApi.fetchMyFamily.mockResolvedValue(family({ solo: true }));
  await renderScreen();
  expect(
    await screen.findByText(
      "La messagerie s'ouvrira quand l'autre parent aura rejoint",
    ),
  ).toBeOnTheScreen();
  expect(messageApi.list).not.toHaveBeenCalled();
  expect(realtime.subscribedFamilies()).toEqual([]);
  expect(screen.queryByLabelText(/Votre message/)).toBeNull();
  expect(screen.queryByRole('button', { name: 'Retour' })).toBeNull();
});

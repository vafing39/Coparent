import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { NewConversationScreen } from '../NewConversationScreen';
import { ApiError } from '../../../api/errors';
import type { Conversation, Family } from '../../../api/types';
import { FamilyProvider } from '../../../context/FamilyContext';
import { MessagesProvider } from '../../../context/MessagesContext';
import { useSession } from '../../../stores/session';
import { authResponse } from '../../../test-utils/authFixtures';
import { familyApi, messageApi } from '../../../test-utils/fakeApiClient';
import { family } from '../../../test-utils/familyFixtures';
import { renderWithProviders } from '../../../test-utils/render';

jest.mock('../../../api/client', () =>
  jest.requireActual('../../../test-utils/fakeApiClient'),
);

const ME = '0c3b6a2e-0000-0000-0000-000000000001';
const TWO_PARENTS: Family = family({
  solo: false,
  members: [
    { userId: ME, firstName: 'Camille', role: 'PARENT_A' },
    { userId: 'u2', firstName: 'Julien', role: 'PARENT_B' },
  ],
});
const FAMILY_ID = TWO_PARENTS.id;

const NOEL: Conversation = {
  id: 'conv-noel',
  subject: 'Vacances de Noël',
  authorFirstName: 'Camille',
  createdAt: '2026-11-13T13:30:00Z',
  lastMessage: {
    id: 'm1',
    conversationId: 'conv-noel',
    seq: 1,
    senderId: ME,
    senderFirstName: 'Camille',
    body: 'Je propose du 19 au 26.',
    createdAt: '2026-11-13T13:30:00Z',
    readAt: null,
  },
  unreadCount: 0,
};

const goBack = jest.fn();
const replace = jest.fn();
const props = {
  navigation: { goBack, replace },
  route: { key: 'NewConversation', name: 'NewConversation' },
} as unknown as React.ComponentProps<typeof NewConversationScreen>;

async function renderScreen() {
  await renderWithProviders(
    <FamilyProvider>
      <MessagesProvider>
        <NewConversationScreen {...props} />
      </MessagesProvider>
    </FamilyProvider>,
  );
  await screen.findByRole('header', { name: 'Nouvelle discussion' });
}

const send = () =>
  fireEvent.press(screen.getByRole('button', { name: 'Envoyer' }));

beforeEach(async () => {
  goBack.mockReset();
  replace.mockReset();
  messageApi.createConversation.mockReset();
  familyApi.fetchMyFamily.mockResolvedValue(TWO_PARENTS);
  await useSession.getState().signIn(authResponse());
});

test('création : sujet et premier message envoyés, puis la discussion s’ouvre', async () => {
  messageApi.createConversation.mockResolvedValue(NOEL);
  await renderScreen();
  await fireEvent.changeText(
    screen.getByLabelText('Sujet'),
    ' Vacances de Noël ',
  );
  await fireEvent.changeText(
    screen.getByLabelText('Premier message'),
    'Je propose du 19 au 26.',
  );
  await send();

  expect(messageApi.createConversation).toHaveBeenCalledWith(FAMILY_ID, {
    subject: 'Vacances de Noël',
    body: 'Je propose du 19 au 26.',
  });
  expect(replace).toHaveBeenCalledWith('Conversation', {
    conversationId: 'conv-noel',
    subject: 'Vacances de Noël',
  });
});

test('erreurs : sujet et message vides', async () => {
  await renderScreen();
  await send();
  expect(
    await screen.findByText('Indiquez le sujet de la discussion.'),
  ).toBeOnTheScreen();
  expect(screen.getByText('Écrivez un message.')).toBeOnTheScreen();
  expect(messageApi.createConversation).not.toHaveBeenCalled();
});

test('erreur du serveur affichée, rien n’est ouvert', async () => {
  messageApi.createConversation.mockRejectedValue(new ApiError(500));
  await renderScreen();
  await fireEvent.changeText(screen.getByLabelText('Sujet'), 'Rentrée');
  await fireEvent.changeText(
    screen.getByLabelText('Premier message'),
    'Bonjour',
  );
  await send();
  expect(
    await screen.findByText(
      'Connexion impossible pour le moment. Vérifiez votre accès à Internet, puis réessayez.',
    ),
  ).toBeOnTheScreen();
  expect(replace).not.toHaveBeenCalled();
});

test('« Annuler » ferme sans rien envoyer', async () => {
  await renderScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Annuler' }));
  expect(goBack).toHaveBeenCalled();
  expect(messageApi.createConversation).not.toHaveBeenCalled();
});

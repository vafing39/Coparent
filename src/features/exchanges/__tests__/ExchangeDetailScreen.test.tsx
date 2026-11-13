import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { ExchangeDetailScreen } from '../ExchangeDetailScreen';
import { ApiError } from '../../../api/errors';
import type { Exchange, Family } from '../../../api/types';
import { ExchangesProvider } from '../../../context/ExchangesContext';
import { FamilyProvider } from '../../../context/FamilyContext';
import { useSession } from '../../../stores/session';
import { authResponse } from '../../../test-utils/authFixtures';
import { exchangeApi, familyApi } from '../../../test-utils/fakeApiClient';
import { family } from '../../../test-utils/familyFixtures';
import { renderWithProviders } from '../../../test-utils/render';

jest.mock('../../../api/client', () =>
  jest.requireActual('../../../test-utils/fakeApiClient'),
);

/** Je suis Camille (A) ; Julien (B) demande à prendre mon week-end du 13 au 15 novembre. */
const TWO_PARENTS: Family = family({
  solo: false,
  members: [
    { userId: 'u1', firstName: 'Camille', role: 'PARENT_A' },
    { userId: 'u2', firstName: 'Julien', role: 'PARENT_B' },
  ],
});

const FROM_JULIEN: Exchange = {
  id: 'ex-1',
  status: 'PENDING',
  requesterRole: 'PARENT_B',
  requestedByFirstName: 'Julien',
  mine: false,
  takeFrom: '2026-11-13',
  takeTo: '2026-11-15',
  giveFrom: '2026-11-20',
  giveTo: '2026-11-22',
  message: 'Mariage de ma sœur',
  createdAt: '2026-11-10T09:00:00Z',
  answeredAt: null,
};
const MINE: Exchange = {
  ...FROM_JULIEN,
  requesterRole: 'PARENT_A',
  requestedByFirstName: 'Camille',
  mine: true,
  giveFrom: null,
  giveTo: null,
  message: null,
};

const goBack = jest.fn();
const navigate = jest.fn();

async function renderScreen() {
  const props = {
    navigation: { goBack, navigate },
    route: {
      key: 'ExchangeDetail',
      name: 'ExchangeDetail',
      params: { exchangeId: 'ex-1' },
    },
  } as unknown as React.ComponentProps<typeof ExchangeDetailScreen>;
  await renderWithProviders(
    <FamilyProvider>
      <ExchangesProvider>
        <ExchangeDetailScreen {...props} />
      </ExchangesProvider>
    </FamilyProvider>,
  );
}

beforeEach(async () => {
  goBack.mockReset();
  navigate.mockReset();
  exchangeApi.get.mockReset().mockResolvedValue(FROM_JULIEN);
  exchangeApi.answer
    .mockReset()
    .mockImplementation(async (_familyId, _id, answer) => ({
      ...FROM_JULIEN,
      status: answer === 'accept' ? 'ACCEPTED' : 'DECLINED',
    }));
  familyApi.fetchMyFamily.mockResolvedValue(TWO_PARENTS);
  await useSession.getState().signIn(authResponse());
});

test('demande de l’autre parent : le résumé, puis « Accepter »', async () => {
  await renderScreen();
  expect(
    await screen.findByText('Julien attend votre réponse.'),
  ).toBeOnTheScreen();
  expect(exchangeApi.get).toHaveBeenCalledWith(TWO_PARENTS.id, 'ex-1');
  expect(screen.getByText('Julien prend (vos nuits)')).toBeOnTheScreen();
  expect(screen.getByText('ven. 13 nov. – dim. 15 nov.')).toBeOnTheScreen();
  expect(screen.getByText('Julien vous laisse')).toBeOnTheScreen();
  expect(screen.getByText('ven. 20 nov. – dim. 22 nov.')).toBeOnTheScreen();
  expect(screen.getByText('Mariage de ma sœur')).toBeOnTheScreen();
  expect(
    screen.queryByRole('button', { name: 'Annuler la demande' }),
  ).toBeNull();

  await fireEvent.press(screen.getByRole('button', { name: 'Accepter' }));
  expect(exchangeApi.answer).toHaveBeenCalledWith(
    TWO_PARENTS.id,
    'ex-1',
    'accept',
  );
  await waitFor(() => expect(goBack).toHaveBeenCalled());
});

test('« Refuser » après confirmation', async () => {
  const alert = jest.spyOn(Alert, 'alert');
  await renderScreen();
  await fireEvent.press(await screen.findByRole('button', { name: 'Refuser' }));
  expect(alert.mock.calls[0][0]).toBe('Refuser cet échange ?');
  expect(exchangeApi.answer).not.toHaveBeenCalled();
  await act(async () => {
    alert.mock.calls[0][2]?.find(b => b.text === 'Refuser')?.onPress?.();
  });
  expect(exchangeApi.answer).toHaveBeenCalledWith(
    TWO_PARENTS.id,
    'ex-1',
    'decline',
  );
  await waitFor(() => expect(goBack).toHaveBeenCalled());
  alert.mockRestore();
});

test('« Proposer une autre date » ouvre une discussion sur cet échange', async () => {
  await renderScreen();
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Proposer une autre date' }),
  );
  expect(navigate).toHaveBeenCalledWith('NewConversation', {
    subject: 'Échange du ven. 13 nov. – dim. 15 nov.',
  });
  expect(exchangeApi.answer).not.toHaveBeenCalled();
});

test('ma demande : en attente de l’autre parent, « Annuler la demande »', async () => {
  const alert = jest.spyOn(Alert, 'alert');
  exchangeApi.get.mockResolvedValue(MINE);
  exchangeApi.answer.mockResolvedValue({ ...MINE, status: 'CANCELLED' });
  await renderScreen();
  expect(
    await screen.findByText('En attente de la réponse de Julien.'),
  ).toBeOnTheScreen();
  expect(screen.getByText('Vous prenez (nuits chez Julien)')).toBeOnTheScreen();
  expect(screen.getByText('Rien')).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Accepter' })).toBeNull();

  await fireEvent.press(
    screen.getByRole('button', { name: 'Annuler la demande' }),
  );
  await act(async () => {
    alert.mock.calls[0][2]
      ?.find(b => b.text === 'Annuler la demande')
      ?.onPress?.();
  });
  expect(exchangeApi.answer).toHaveBeenCalledWith(
    TWO_PARENTS.id,
    'ex-1',
    'cancel',
  );
  alert.mockRestore();
});

test('déjà traitée : le statut, sans action', async () => {
  exchangeApi.get.mockResolvedValue({ ...FROM_JULIEN, status: 'ACCEPTED' });
  await renderScreen();
  expect(
    await screen.findByText('Échange accepté : le calendrier est à jour.'),
  ).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Accepter' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Refuser' })).toBeNull();
});

test('réponse refusée par le serveur : son message s’affiche', async () => {
  exchangeApi.answer.mockRejectedValue(
    new ApiError(409, "Cette demande n'attend plus de réponse."),
  );
  await renderScreen();
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Accepter' }),
  );
  expect(
    await screen.findByText("Cette demande n'attend plus de réponse."),
  ).toBeOnTheScreen();
  expect(goBack).not.toHaveBeenCalled();
});

test('demande introuvable', async () => {
  exchangeApi.get.mockRejectedValue(new ApiError(404));
  await renderScreen();
  expect(
    await screen.findByText("Cette demande d'échange n'existe plus."),
  ).toBeOnTheScreen();
});

import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { ExchangeFormScreen } from '../ExchangeFormScreen';
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

/** Mardi 10 novembre 2026, 19 h 30 à Paris : demain, c'est le 11. */
const NOW = new Date('2026-11-10T18:30:00Z');

const TWO_PARENTS: Family = family({
  solo: false,
  members: [
    { userId: 'u1', firstName: 'Camille', role: 'PARENT_A' },
    { userId: 'u2', firstName: 'Julien', role: 'PARENT_B' },
  ],
});

const CREATED: Exchange = {
  id: 'ex-1',
  status: 'PENDING',
  requesterRole: 'PARENT_A',
  requestedByFirstName: 'Camille',
  mine: true,
  takeFrom: '2026-11-11',
  takeTo: '2026-11-11',
  giveFrom: null,
  giveTo: null,
  message: null,
  createdAt: '2026-11-10T18:30:00Z',
  answeredAt: null,
};

const goBack = jest.fn();
const replace = jest.fn();

async function renderScreen() {
  const props = {
    navigation: { goBack, replace },
    route: { key: 'ExchangeForm', name: 'ExchangeForm' },
  } as unknown as React.ComponentProps<typeof ExchangeFormScreen>;
  await renderWithProviders(
    <FamilyProvider>
      <ExchangesProvider>
        <ExchangeFormScreen {...props} />
      </ExchangesProvider>
    </FamilyProvider>,
  );
  await screen.findByRole('header', { name: 'Demander un échange' });
}

const send = () =>
  fireEvent.press(screen.getByRole('button', { name: 'Envoyer' }));

/** Choisit un jour dans le sélecteur iOS (simulé) du champ n° `index` qui porte ce nom. */
async function pickDate(name: RegExp, day: number, index = 0) {
  await fireEvent.press(screen.getAllByRole('button', { name })[index]);
  await fireEvent(
    screen.getByTestId('date-picker'),
    'onChange',
    { type: 'set' },
    new Date(2026, 10, day, 12),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'OK' }));
}

beforeEach(async () => {
  jest.useFakeTimers({ now: NOW });
  goBack.mockReset();
  replace.mockReset();
  exchangeApi.create.mockReset().mockResolvedValue(CREATED);
  familyApi.fetchMyFamily.mockResolvedValue(TWO_PARENTS);
  await useSession.getState().signIn(authResponse());
});

afterEach(() => {
  jest.useRealTimers();
});

test('par défaut : la nuit de demain, sans contrepartie ; la demande s’ouvre', async () => {
  await renderScreen();
  expect(
    screen.getByRole('header', { name: 'Je prends (nuits chez Julien)' }),
  ).toBeOnTheScreen();
  expect(
    screen.getByRole('button', { name: 'Première nuit : mer. 11 nov. 2026' }),
  ).toBeOnTheScreen();
  await send();
  await waitFor(() =>
    expect(exchangeApi.create).toHaveBeenCalledWith(TWO_PARENTS.id, {
      takeFrom: '2026-11-11',
      takeTo: '2026-11-11',
    }),
  );
  expect(replace).toHaveBeenCalledWith('ExchangeDetail', {
    exchangeId: 'ex-1',
  });
});

test('un week-end contre un autre, avec un message', async () => {
  await renderScreen();
  await pickDate(/^Première nuit/, 13);
  await pickDate(/^Dernière nuit/, 15);
  await fireEvent.press(
    screen.getByRole('switch', { name: 'En retour, je laisse des nuits' }),
  );
  expect(
    screen.getByText('Les nuits qui passent chez Julien à la place.'),
  ).toBeOnTheScreen();
  await pickDate(/^Première nuit/, 20, 1);
  await pickDate(/^Dernière nuit/, 22, 1);
  await fireEvent.changeText(
    screen.getByLabelText('Message (facultatif)'),
    '  Mariage de ma sœur  ',
  );
  await send();
  await waitFor(() =>
    expect(exchangeApi.create).toHaveBeenCalledWith(TWO_PARENTS.id, {
      takeFrom: '2026-11-13',
      takeTo: '2026-11-15',
      giveFrom: '2026-11-20',
      giveTo: '2026-11-22',
      message: 'Mariage de ma sœur',
    }),
  );
});

test('erreurs du formulaire : rien n’est envoyé', async () => {
  await renderScreen();
  await pickDate(/^Première nuit/, 14);
  await pickDate(/^Dernière nuit/, 12);
  await send();
  expect(
    await screen.findByText('La dernière nuit doit suivre la première.'),
  ).toBeOnTheScreen();

  // Les nuits laissées recouvrent les nuits prises
  await pickDate(/^Dernière nuit/, 15);
  await fireEvent.press(
    screen.getByRole('switch', { name: 'En retour, je laisse des nuits' }),
  );
  await pickDate(/^Première nuit/, 15, 1);
  await pickDate(/^Dernière nuit/, 16, 1);
  await send();
  expect(
    await screen.findByText('Les deux périodes ne peuvent pas se chevaucher.'),
  ).toBeOnTheScreen();
  expect(exchangeApi.create).not.toHaveBeenCalled();
});

test('refus du serveur : son message s’affiche', async () => {
  exchangeApi.create.mockRejectedValue(
    new ApiError(400, 'Les nuits que vous prenez doivent être chez Julien.'),
  );
  await renderScreen();
  await send();
  expect(
    await screen.findByText(
      'Les nuits que vous prenez doivent être chez Julien.',
    ),
  ).toBeOnTheScreen();
  expect(replace).not.toHaveBeenCalled();
});

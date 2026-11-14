import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { DepensesScreen } from '../DepensesScreen';
import type { Family } from '../../../api/types';
import { ExpensesProvider } from '../../../context/ExpensesContext';
import { FamilyProvider } from '../../../context/FamilyContext';
import { useSession } from '../../../stores/session';
import { authResponse } from '../../../test-utils/authFixtures';
import { expense } from '../../../test-utils/expenseFixtures';
import { expenseApi, familyApi } from '../../../test-utils/fakeApiClient';
import { family } from '../../../test-utils/familyFixtures';
import { renderWithProviders } from '../../../test-utils/render';

jest.mock('../../../api/client', () =>
  jest.requireActual('../../../test-utils/fakeApiClient'),
);

const navigate = jest.fn();
const props = {
  navigation: { navigate },
  route: { key: 'Depenses', name: 'Depenses' },
} as unknown as React.ComponentProps<typeof DepensesScreen>;

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

const TO_ANSWER = expense({
  id: 'exp-cantine',
  label: 'Cantine de novembre',
  amountCents: 6420,
  category: 'CANTEEN',
  children: [
    { id: 'c1', firstName: 'Léa' },
    { id: 'c2', firstName: 'Hugo' },
  ],
  payerRole: 'PARENT_B',
  authorRole: 'PARENT_B',
  authorFirstName: 'Julien',
  mine: false,
  canAnswer: true,
  canEdit: false,
});
const CONTESTED = expense({
  id: 'exp-lunettes',
  label: 'Lunettes de Hugo',
  status: 'CONTESTED',
  amountCents: 12900,
  contestReason: 'NOT_AGREED',
  contestNote: 'Je souhaitais voir le devis.',
});
const VALIDATED = expense({
  id: 'exp-judo',
  status: 'VALIDATED',
  canEdit: false,
});

async function renderScreen(found: Family) {
  familyApi.fetchMyFamily.mockResolvedValue(found);
  await renderWithProviders(
    <FamilyProvider>
      <ExpensesProvider>
        <DepensesScreen {...props} />
      </ExpensesProvider>
    </FamilyProvider>,
  );
  await screen.findByRole('header', { name: 'Dépenses' });
}

beforeEach(async () => {
  navigate.mockReset();
  expenseApi.list
    .mockReset()
    .mockResolvedValue([TO_ANSWER, CONTESTED, VALIDATED]);
  expenseApi.balance.mockReset().mockResolvedValue({
    debtorRole: 'PARENT_B',
    amountCents: 4250,
    lines: [],
    openSettlement: null,
  });
  expenseApi.answer
    .mockReset()
    .mockResolvedValue(
      expense({ ...TO_ANSWER, status: 'VALIDATED', canAnswer: false }),
    );
  await useSession.getState().signIn(authResponse());
});

test('à deux : le solde, puis chaque dépense avec son statut', async () => {
  await renderScreen(TWO_PARENTS);

  expect(await screen.findByText('Julien doit 42,50 € à Camille')).toBeTruthy();
  expect(
    screen.getByText('Léa et Hugo · 50/50 · payée par Julien'),
  ).toBeTruthy();
  expect(screen.getByText('En attente de votre réponse')).toBeTruthy();
  expect(screen.getByText('Contestée par Julien')).toBeTruthy();
  expect(
    screen.getByText(
      'Motif : Dépense non décidée ensemble « Je souhaitais voir le devis. »',
    ),
  ).toBeTruthy();
  expect(screen.getByText('Validée')).toBeTruthy();

  await fireEvent.press(
    screen.getByRole('button', { name: 'Détail et règlement' }),
  );
  expect(navigate).toHaveBeenCalledWith('Balance');
});

test('les filtres ne gardent que les dépenses de ce statut', async () => {
  await renderScreen(TWO_PARENTS);
  await screen.findByText('Cantine de novembre');

  await fireEvent.press(screen.getByRole('button', { name: 'Validées' }));
  expect(screen.queryByText('Cantine de novembre')).toBeNull();
  expect(screen.getByText('Licence de judo')).toBeTruthy();

  await fireEvent.press(screen.getByRole('button', { name: 'Contestées' }));
  expect(screen.getByText('Lunettes de Hugo')).toBeTruthy();
  expect(screen.queryByText('Licence de judo')).toBeNull();
});

test('accepter, contester, corriger et retirer', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await renderScreen(TWO_PARENTS);
  await screen.findByText('Cantine de novembre');

  await fireEvent.press(
    screen.getByRole('button', { name: 'Accepter : Cantine de novembre' }),
  );
  await waitFor(() =>
    expect(expenseApi.answer).toHaveBeenCalledWith(
      TWO_PARENTS.id,
      'exp-cantine',
      'accept',
      undefined,
    ),
  );

  await fireEvent.press(
    screen.getByRole('button', { name: 'Contester : Cantine de novembre' }),
  );
  expect(navigate).toHaveBeenCalledWith('ContestExpense', {
    expenseId: 'exp-cantine',
  });

  await fireEvent.press(
    screen.getByRole('button', { name: 'Corriger : Lunettes de Hugo' }),
  );
  expect(navigate).toHaveBeenCalledWith('ExpenseForm', {
    expenseId: 'exp-lunettes',
  });

  await fireEvent.press(
    screen.getByRole('button', { name: 'Retirer : Lunettes de Hugo' }),
  );
  const buttons = alert.mock.calls[0][2] ?? [];
  await act(async () => {
    buttons.find(button => button.text === 'Retirer')?.onPress?.();
  });
  await waitFor(() =>
    expect(expenseApi.answer).toHaveBeenCalledWith(
      TWO_PARENTS.id,
      'exp-lunettes',
      'withdraw',
      undefined,
    ),
  );
  alert.mockRestore();
});

test('une dépense avec justificatif : le lien ouvre la photo', async () => {
  expenseApi.list.mockResolvedValue([
    expense({ receiptUpdatedAt: '2026-11-08T10:05:00Z' }),
  ]);
  await renderScreen(TWO_PARENTS);
  await fireEvent.press(
    await screen.findByRole('link', {
      name: 'Voir le justificatif de Licence de judo',
    }),
  );
  expect(navigate).toHaveBeenCalledWith('Receipt', { expenseId: 'exp-1' });
});

test('en solo : le total enregistré, sans solde', async () => {
  expenseApi.list.mockResolvedValue([
    expense({ amountCents: 8500 }),
    expense({ id: 'exp-2', label: 'Pharmacie', amountCents: 560 }),
  ]);
  await renderScreen(
    family({
      children: CHILDREN,
      invitation: {
        inviteeFirstName: 'Julien',
        sentAt: '2026-11-08T10:00:00Z',
        expiresAt: '2026-11-15T10:00:00Z',
        expired: false,
      },
    }),
  );

  expect(await screen.findByText('90,60\u00a0€')).toBeTruthy();
  expect(screen.getByText('Enregistré en attendant Julien')).toBeTruthy();
  expect(screen.getAllByText('À proposer à Julien')).toHaveLength(2);
  expect(
    screen.queryByRole('button', { name: 'Détail et règlement' }),
  ).toBeNull();
  expect(expenseApi.balance).not.toHaveBeenCalled();

  await fireEvent.press(
    screen.getByRole('button', { name: 'Ajouter une dépense' }),
  );
  expect(navigate).toHaveBeenCalledWith('ExpenseForm');
});

import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { BalanceScreen } from '../BalanceScreen';
import { ContestExpenseScreen } from '../ContestExpenseScreen';
import { ExpenseFormScreen } from '../ExpenseFormScreen';
import { ApiError } from '../../../api/errors';
import type { Balance, Family } from '../../../api/types';
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

/** Mardi 10 novembre 2026, 19 h 30 à Paris. */
const NOW = new Date('2026-11-10T18:30:00Z');

const TWO_PARENTS: Family = family({
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

const goBack = jest.fn();

async function renderScreen(ui: React.ReactElement, header: string) {
  await renderWithProviders(
    <FamilyProvider>
      <ExpensesProvider>{ui}</ExpensesProvider>
    </FamilyProvider>,
  );
  await screen.findByRole('header', { name: header });
}

function props<P>(name: string, params?: object): P {
  return {
    navigation: { goBack },
    route: { key: name, name, params },
  } as unknown as P;
}

beforeEach(async () => {
  jest.useFakeTimers({ now: NOW });
  goBack.mockReset();
  familyApi.fetchMyFamily.mockResolvedValue(TWO_PARENTS);
  expenseApi.list.mockReset().mockResolvedValue([]);
  expenseApi.balance.mockReset();
  expenseApi.create.mockReset().mockResolvedValue(expense());
  expenseApi.update.mockReset().mockResolvedValue(expense());
  expenseApi.answer.mockReset().mockResolvedValue(expense());
  expenseApi.declare.mockReset();
  expenseApi.answerSettlement.mockReset();
  await useSession.getState().signIn(authResponse());
});

afterEach(() => {
  jest.useRealTimers();
});

describe('nouvelle dépense', () => {
  const renderForm = () =>
    renderScreen(
      <ExpenseFormScreen
        {...props<React.ComponentProps<typeof ExpenseFormScreen>>(
          'ExpenseForm',
        )}
      />,
      'Nouvelle dépense',
    );

  test('libellé et montant obligatoires, puis envoi en centimes', async () => {
    await renderForm();

    await fireEvent.press(screen.getByRole('button', { name: 'Ajouter' }));
    expect(await screen.findByText('Indiquez un libellé.')).toBeTruthy();
    expect(
      screen.getByText('Indiquez un montant, par exemple 64,20.'),
    ).toBeTruthy();
    expect(expenseApi.create).not.toHaveBeenCalled();

    await fireEvent.changeText(
      screen.getByLabelText('Libellé'),
      'Cantine de novembre',
    );
    await fireEvent.changeText(screen.getByLabelText('Montant (€)'), '64,20');
    expect(screen.getByText('Part de Julien')).toBeTruthy();
    expect(screen.getByText('32,10 €')).toBeTruthy();
    await fireEvent.press(screen.getByRole('radio', { name: 'Cantine' }));
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Hugo' }));

    // Répartition 70/30 : Julien doit 30 %
    await fireEvent.press(
      screen.getByRole('button', { name: 'Répartition : 50/50' }),
    );
    await fireEvent.press(
      screen.getByRole('radio', { name: 'Camille 70 % · Julien 30 %' }),
    );
    expect(screen.getByText('19,26 €')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Ajouter' }));
    await waitFor(() =>
      expect(expenseApi.create).toHaveBeenCalledWith(TWO_PARENTS.id, {
        label: 'Cantine de novembre',
        amountCents: 6420,
        category: 'CANTEEN',
        childIds: ['c1'],
        payerRole: 'PARENT_A',
        paidOn: '2026-11-10',
        payerSharePercent: 70,
      }),
    );
    expect(goBack).toHaveBeenCalled();
  });

  test('un refus du serveur s’affiche tel quel', async () => {
    expenseApi.create.mockRejectedValue(
      new ApiError(400, 'Choisissez une répartition proposée.'),
    );
    await renderForm();
    await fireEvent.changeText(screen.getByLabelText('Libellé'), 'Judo');
    await fireEvent.changeText(screen.getByLabelText('Montant (€)'), '85');
    await fireEvent.press(screen.getByRole('button', { name: 'Ajouter' }));

    expect(
      await screen.findByText('Choisissez une répartition proposée.'),
    ).toBeTruthy();
    expect(goBack).not.toHaveBeenCalled();
  });
});

test('corriger une dépense contestée : PUT avec les valeurs reprises', async () => {
  expenseApi.list.mockResolvedValue([
    expense({ status: 'CONTESTED', contestReason: 'AMOUNT' }),
  ]);
  await renderScreen(
    <ExpenseFormScreen
      {...props<React.ComponentProps<typeof ExpenseFormScreen>>('ExpenseForm', {
        expenseId: 'exp-1',
      })}
    />,
    'Corriger la dépense',
  );
  expect(screen.getByDisplayValue('85,00')).toBeTruthy();

  await fireEvent.changeText(screen.getByLabelText('Montant (€)'), '80');
  await fireEvent.press(screen.getByRole('button', { name: 'Enregistrer' }));
  await waitFor(() =>
    expect(expenseApi.update).toHaveBeenCalledWith(
      TWO_PARENTS.id,
      'exp-1',
      expect.objectContaining({ label: 'Licence de judo', amountCents: 8000 }),
    ),
  );
});

test('contester : motif et précision, puis retour', async () => {
  expenseApi.list.mockResolvedValue([
    expense({
      authorRole: 'PARENT_B',
      payerRole: 'PARENT_B',
      mine: false,
      canAnswer: true,
      canEdit: false,
    }),
  ]);
  await renderScreen(
    <ContestExpenseScreen
      {...props<React.ComponentProps<typeof ContestExpenseScreen>>(
        'ContestExpense',
        { expenseId: 'exp-1' },
      )}
    />,
    'Contester',
  );
  expect(screen.getByText('Ajoutée par Julien · Léa · 50/50')).toBeTruthy();

  await fireEvent.press(
    screen.getByRole('radio', { name: 'Justificatif manquant ou illisible' }),
  );
  await fireEvent.changeText(
    screen.getByLabelText('Précision pour Julien'),
    'Peux-tu envoyer la facture ?',
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Envoyer la contestation' }),
  );
  await waitFor(() =>
    expect(expenseApi.answer).toHaveBeenCalledWith(
      TWO_PARENTS.id,
      'exp-1',
      'contest',
      { reason: 'RECEIPT', note: 'Peux-tu envoyer la facture ?' },
    ),
  );
  expect(goBack).toHaveBeenCalled();
});

describe('solde et règlement', () => {
  const renderBalance = (balance: Balance) => {
    expenseApi.balance.mockResolvedValue(balance);
    return renderScreen(
      <BalanceScreen
        {...props<React.ComponentProps<typeof BalanceScreen>>('Balance')}
      />,
      'Solde et règlement',
    );
  };
  const LINE = {
    kind: 'EXPENSE' as const,
    id: 'exp-1',
    label: 'Licence de judo',
    amountCents: 8500,
    payerRole: 'PARENT_B' as const,
    payerSharePercent: 50,
    owedCents: 4250,
    date: '2026-11-08',
  };

  test('je dois le solde : je déclare mon virement', async () => {
    expenseApi.declare.mockResolvedValue({
      id: 's1',
      payerRole: 'PARENT_A',
      amountCents: 4250,
      status: 'DECLARED',
      mine: true,
      declaredAt: '2026-11-10T18:30:00Z',
      answeredAt: null,
    });
    await renderBalance({
      debtorRole: 'PARENT_A',
      amountCents: 4250,
      lines: [LINE],
      openSettlement: null,
    });

    expect(
      await screen.findByText('Camille doit 42,50 € à Julien'),
    ).toBeTruthy();
    expect(screen.getByText('Licence de judo · 85,00 €')).toBeTruthy();
    expect(screen.getByText('Camille : 42,50 €')).toBeTruthy();

    await fireEvent.press(
      screen.getByRole('button', {
        name: 'Déclarer un virement de 42,50 €',
      }),
    );
    await waitFor(() =>
      expect(expenseApi.declare).toHaveBeenCalledWith(TWO_PARENTS.id, 4250),
    );
  });

  test('l’autre parent a déclaré : je confirme, ou pas encore reçu', async () => {
    expenseApi.answerSettlement.mockResolvedValue({
      id: 's1',
      payerRole: 'PARENT_B',
      amountCents: 4250,
      status: 'CONFIRMED',
      mine: false,
      declaredAt: '2026-11-10T08:00:00Z',
      answeredAt: '2026-11-10T18:30:00Z',
    });
    await renderBalance({
      debtorRole: 'PARENT_B',
      amountCents: 4250,
      lines: [{ ...LINE, payerRole: 'PARENT_A' }],
      openSettlement: {
        id: 's1',
        payerRole: 'PARENT_B',
        amountCents: 4250,
        status: 'DECLARED',
        mine: false,
        declaredAt: '2026-11-10T08:00:00Z',
        answeredAt: null,
      },
    });

    expect(
      await screen.findByText(
        'Julien a déclaré un virement de 42,50 € le 10 novembre.',
      ),
    ).toBeTruthy();
    await fireEvent.press(
      screen.getByRole('button', { name: "Je ne l'ai pas encore reçu" }),
    );
    await waitFor(() =>
      expect(expenseApi.answerSettlement).toHaveBeenCalledWith(
        TWO_PARENTS.id,
        's1',
        'not-received',
      ),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Confirmer la réception' }),
    );
    await waitFor(() =>
      expect(expenseApi.answerSettlement).toHaveBeenCalledWith(
        TWO_PARENTS.id,
        's1',
        'confirm',
      ),
    );
  });

  test('solde à zéro : rien à régler', async () => {
    await renderBalance({
      debtorRole: null,
      amountCents: 0,
      lines: [],
      openSettlement: null,
    });
    expect(await screen.findByText('Solde réglé · 0,00 €')).toBeTruthy();
    expect(screen.getByText("Rien à régler pour l'instant.")).toBeTruthy();
  });
});

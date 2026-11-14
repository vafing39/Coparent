import React, { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { expenseErrorMessage, nameOf, otherRole } from '../../api/expenses';
import type { Expense } from '../../api/types';
import { ErrorText } from '../../components/ErrorText';
import { LoadError } from '../../components/LoadError';
import { BalanceCard } from '../../features/expenses/BalanceCard';
import {
  ExpenseFilter,
  ExpenseFilters,
} from '../../features/expenses/ExpenseFilters';
import { ExpenseList } from '../../features/expenses/ExpenseList';
import { ExpensesHeader } from '../../features/expenses/ExpensesHeader';
import { SoloTotalCard } from '../../features/expenses/SoloTotalCard';
import { useExpenses } from '../../hooks/useExpenses';
import { useFamily } from '../../hooks/useFamily';
import type { TabScreenProps } from '../../navigation/types';

/**
 * Onglet Dépenses. À deux : le solde courant, les filtres et la liste, avec les réponses
 * possibles sur chaque dépense. En mode solo : le total enregistré, proposé à l'autre parent à
 * son arrivée.
 */
export function DepensesScreen({ navigation }: TabScreenProps<'Depenses'>) {
  const { t } = useTranslation();
  const { family } = useFamily();
  const {
    expenses,
    isLoadingExpenses,
    expensesError,
    reloadExpenses,
    balance,
    balanceError,
    reloadBalance,
    answerExpense,
    isAnsweringExpense,
    answerExpenseError,
  } = useExpenses();
  const [filter, setFilter] = useState<ExpenseFilter>('ALL');

  if (!family) {
    return null;
  }
  const other = nameOf(family, otherRole(family.myRole));

  const withdraw = (expense: Expense) =>
    Alert.alert(
      t('expenses.actions.withdrawTitle'),
      t('expenses.actions.withdrawBody', { label: expense.label, name: other }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('expenses.actions.withdrawConfirm'),
          style: 'destructive',
          onPress: () => answerExpense({ id: expense.id, action: 'withdraw' }),
        },
      ],
    );

  const list = (items: Expense[]) => (
    <ExpenseList
      family={family}
      expenses={items}
      noneYet={!expenses?.length}
      otherName={other}
      busy={isAnsweringExpense}
      onAccept={expense => answerExpense({ id: expense.id, action: 'accept' })}
      onContest={expense =>
        navigation.navigate('ContestExpense', { expenseId: expense.id })
      }
      onEdit={expense =>
        navigation.navigate('ExpenseForm', { expenseId: expense.id })
      }
      onWithdraw={withdraw}
      onViewReceipt={expense =>
        navigation.navigate('Receipt', { expenseId: expense.id })
      }
    />
  );

  let body: React.ReactNode;
  if (expensesError) {
    body = (
      <LoadError message={t('expenses.loadFailed')} onRetry={reloadExpenses} />
    );
  } else if (isLoadingExpenses || !expenses) {
    body = (
      <View
        accessible
        accessibilityLabel={t('common.loading')}
        className="h-40 rounded-[20px] bg-surface"
      />
    );
  } else if (family.solo) {
    body = (
      <>
        <SoloTotalCard
          totalCents={expenses.reduce((sum, e) => sum + e.amountCents, 0)}
          otherName={other}
        />
        {list(expenses)}
      </>
    );
  } else {
    body = (
      <>
        <BalanceCard
          family={family}
          balance={balance}
          error={balanceError}
          onRetry={reloadBalance}
          onOpen={() => navigation.navigate('Balance')}
        />
        <ExpenseFilters value={filter} onChange={setFilter} />
        {list(
          filter === 'ALL'
            ? expenses
            : expenses.filter(e => e.status === filter),
        )}
      </>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView contentContainerClassName="gap-3 px-4 pt-5 pb-8">
        <ExpensesHeader
          onAdd={() => navigation.navigate('ExpenseForm')}
          onOpenAccount={() => navigation.navigate('CompteFamille')}
        />
        {answerExpenseError ? (
          <ErrorText text={expenseErrorMessage(answerExpenseError)} />
        ) : null}
        {body}
      </ScrollView>
    </SafeAreaView>
  );
}

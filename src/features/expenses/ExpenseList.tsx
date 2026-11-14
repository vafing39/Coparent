import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Expense, Family } from '../../api/types';
import { ExpenseRow } from './ExpenseRow';

type Props = {
  family: Family;
  expenses: Expense[];
  /** Vrai si la famille n'a encore aucune dépense (sinon : aucune pour ce filtre). */
  noneYet: boolean;
  otherName: string;
  busy: boolean;
  onAccept: (expense: Expense) => void;
  onContest: (expense: Expense) => void;
  onEdit: (expense: Expense) => void;
  onWithdraw: (expense: Expense) => void;
  onViewReceipt: (expense: Expense) => void;
};

/** Carte de la liste des dépenses, ou son état vide. */
export function ExpenseList({
  family,
  expenses,
  noneYet,
  otherName,
  busy,
  onAccept,
  onContest,
  onEdit,
  onWithdraw,
  onViewReceipt,
}: Props) {
  const { t } = useTranslation();
  return (
    <View
      accessibilityLabel={t('expenses.list.label')}
      className="rounded-[20px] bg-card px-4 py-1"
    >
      {expenses.length === 0 ? (
        <View className="items-center gap-2 px-2 py-7">
          <Text className="text-center font-bold text-[15px] text-text">
            {noneYet ? t('expenses.list.none') : t('expenses.list.empty')}
          </Text>
          <Text className="text-center font-regular text-[13px] text-text-secondary">
            {noneYet
              ? t('expenses.list.noneHint', { name: otherName })
              : t('expenses.list.emptyHint')}
          </Text>
        </View>
      ) : (
        expenses.map((expense, index) => (
          <ExpenseRow
            key={expense.id}
            family={family}
            expense={expense}
            divider={index > 0}
            busy={busy}
            onAccept={() => onAccept(expense)}
            onContest={() => onContest(expense)}
            onEdit={() => onEdit(expense)}
            onWithdraw={() => onWithdraw(expense)}
            onViewReceipt={() => onViewReceipt(expense)}
          />
        ))
      )}
    </View>
  );
}

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatEuros } from '../../api/expenses';
import type { Expense, Family } from '../../api/types';
import {
  CheckIcon,
  ClockIcon,
  InfoIcon,
  ReceiptIcon,
} from '../../components/icons';
import { useTheme } from '../../theme/ThemeProvider';
import { ExpenseActions } from './ExpenseActions';
import { contestText, expenseMeta, expenseStatus } from './expenseText';

type Props = {
  family: Family;
  expense: Expense;
  divider: boolean;
  busy: boolean;
  onAccept: () => void;
  onContest: () => void;
  onEdit: () => void;
  onWithdraw: () => void;
  onViewReceipt: () => void;
};

/**
 * Une dépense : initiale de la catégorie, libellé, enfants, répartition et payeur, statut (et
 * motif si contestée), montant. Selon le cas : « Accepter » et « Contester » (l'autre parent),
 * « Corriger » et « Retirer » (l'auteur). Avec un justificatif : le lien pour le voir.
 */
export function ExpenseRow({
  family,
  expense,
  divider,
  busy,
  onAccept,
  onContest,
  onEdit,
  onWithdraw,
  onViewReceipt,
}: Props) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const status = expenseStatus(family, expense);
  const contest = contestText(expense);
  const statusColor =
    expense.status === 'VALIDATED' ? color('validated') : color('pending');
  const category = t(`expenses.categories.${expense.category}`);

  return (
    <View className={`gap-2.5 py-3 ${divider ? 'border-t border-border' : ''}`}>
      <View
        accessible
        accessibilityLabel={[
          expense.label,
          formatEuros(expense.amountCents),
          category,
          expenseMeta(family, expense),
          status,
          contest,
        ]
          .filter(Boolean)
          .join(', ')}
        className="flex-row items-start gap-3"
      >
        <View className="h-10 w-10 items-center justify-center rounded-full bg-background">
          <Text className="font-extrabold text-[15px] text-primary">
            {category.charAt(0)}
          </Text>
        </View>
        <View className="min-w-0 flex-1 gap-0.5">
          <Text className="font-bold text-[15px] text-text">
            {expense.label}
          </Text>
          <Text className="font-regular text-[13px] text-text-secondary">
            {expenseMeta(family, expense)}
          </Text>
          <View className="mt-0.5 flex-row items-center gap-1">
            {expense.status === 'VALIDATED' ? (
              <CheckIcon size={14} color={statusColor} strokeWidth={2.4} />
            ) : expense.status === 'CONTESTED' ? (
              <InfoIcon size={14} color={statusColor} strokeWidth={2.2} />
            ) : (
              <ClockIcon size={14} color={statusColor} strokeWidth={2.2} />
            )}
            <Text
              className={`font-bold text-[13px] ${
                expense.status === 'VALIDATED'
                  ? 'text-validated'
                  : 'text-pending'
              }`}
            >
              {status}
            </Text>
          </View>
          {expense.receiptUpdatedAt ? (
            <Pressable
              onPress={onViewReceipt}
              accessibilityRole="link"
              accessibilityLabel={t('expenses.receipt.viewLabel', {
                label: expense.label,
              })}
              hitSlop={8}
              className="mt-0.5 flex-row items-center gap-1 self-start"
            >
              <ReceiptIcon color={color('primary')} />
              <Text className="font-bold text-[13px] text-primary">
                {t('expenses.receipt.view')}
              </Text>
            </Pressable>
          ) : null}
          {contest ? (
            <Text className="mt-1 rounded-[10px] bg-background px-2.5 py-2 font-regular text-[13px] leading-[18px] text-text">
              {contest}
            </Text>
          ) : null}
        </View>
        <Text className="font-extrabold text-[15px] text-text">
          {formatEuros(expense.amountCents)}
        </Text>
      </View>

      {expense.canAnswer ? (
        <ExpenseActions
          expenseLabel={expense.label}
          actions={[
            {
              label: t('expenses.actions.accept'),
              onPress: onAccept,
              variant: 'primary',
              disabled: busy,
            },
            { label: t('expenses.actions.contest'), onPress: onContest },
          ]}
        />
      ) : null}
      {expense.canEdit ? (
        <ExpenseActions
          expenseLabel={expense.label}
          actions={[
            { label: t('expenses.actions.edit'), onPress: onEdit },
            {
              label: t('expenses.actions.withdraw'),
              onPress: onWithdraw,
              disabled: busy,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

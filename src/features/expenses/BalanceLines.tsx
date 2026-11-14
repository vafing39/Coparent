import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatEuros, nameOf, otherRole, splitLabel } from '../../api/expenses';
import type { Balance, BalanceLine, Family } from '../../api/types';
import i18n from '../../i18n';
import { formatShortDate } from '../../lib/dates';

/** Une ligne du calcul : dépense validée (part due) ou virement confirmé (déduit). */
function lineTexts(family: Family, line: BalanceLine) {
  const payer = nameOf(family, line.payerRole);
  const amount = formatEuros(line.amountCents);
  if (line.kind === 'SETTLEMENT') {
    return {
      title: i18n.t('expenses.settle.settlementLine', { amount }),
      meta: i18n.t('expenses.settle.settlementMeta', {
        name: payer,
        date: formatShortDate(line.date),
      }),
      share: i18n.t('expenses.settle.share', {
        name: payer,
        amount: formatEuros(-line.owedCents),
      }),
    };
  }
  const debtor = nameOf(family, otherRole(line.payerRole));
  return {
    title: i18n.t('expenses.settle.expenseLine', {
      label: line.label ?? '',
      amount,
    }),
    meta: i18n.t('expenses.settle.expenseMeta', {
      name: payer,
      split: splitLabel(line.payerSharePercent ?? 50, payer, debtor),
    }),
    share: i18n.t('expenses.settle.share', {
      name: debtor,
      amount: formatEuros(line.owedCents),
    }),
  };
}

/** « Comment il est calculé » : dépenses validées, virements confirmés, puis le reste à régler. */
export function BalanceLines({
  family,
  balance,
}: {
  family: Family;
  balance: Balance;
}) {
  const { t } = useTranslation();
  return (
    <View className="rounded-[20px] bg-card px-4 pb-2.5 pt-1.5">
      <Text
        accessibilityRole="header"
        className="mb-0.5 mt-2 font-extrabold text-[15px] text-text"
      >
        {t('expenses.settle.how')}
      </Text>
      {balance.lines.length === 0 ? (
        <Text className="py-3 font-regular text-[13px] text-text-secondary">
          {t('expenses.settle.noLines')}
        </Text>
      ) : (
        balance.lines.map((line, index) => {
          const texts = lineTexts(family, line);
          return (
            <View
              key={`${line.kind}-${line.id}`}
              accessible
              className={`min-h-[52px] flex-row items-center gap-2.5 py-1.5 ${
                index === 0 ? '' : 'border-t border-border'
              }`}
            >
              <View className="flex-1">
                <Text className="font-bold text-[15px] text-text">
                  {texts.title}
                </Text>
                <Text className="font-regular text-[13px] text-text-secondary">
                  {texts.meta}
                </Text>
              </View>
              <Text className="text-right font-extrabold text-[13px] text-text">
                {texts.share}
              </Text>
            </View>
          );
        })
      )}
      <View
        accessible
        className="flex-row justify-between border-t-[1.5px] border-text pt-2"
      >
        <Text className="font-extrabold text-[15px] text-text">
          {t('expenses.settle.remaining')}
        </Text>
        <Text className="font-extrabold text-[15px] text-text">
          {formatEuros(balance.amountCents)}
        </Text>
      </View>
    </View>
  );
}

import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatEuros, nameOf, otherRole } from '../../api/expenses';
import type { Balance, Family, FamilyRole } from '../../api/types';
import { ArrowRightIcon } from '../../components/icons';
import { ParentRing } from '../custody/ParentRing';
import { parentOf } from '../custody/parents';
import { useTheme } from '../../theme/ThemeProvider';

/** Les pastilles « débiteur → créancier » et la phrase du solde. */
export function BalanceSummary({
  family,
  balance,
  large = false,
}: {
  family: Family;
  balance: Balance;
  large?: boolean;
}) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const debtor: FamilyRole = balance.debtorRole ?? family.myRole;
  const creditor = otherRole(debtor);
  const text = balance.debtorRole
    ? t('expenses.balance.owes', {
        debtor: nameOf(family, debtor),
        amount: formatEuros(balance.amountCents),
        creditor: nameOf(family, creditor),
      })
    : t('expenses.balance.settled', { amount: formatEuros(0) });

  return (
    <View className="flex-row items-center gap-3">
      <View className="flex-row items-center">
        <ParentRing
          role={debtor}
          initial={parentOf(family, debtor).initial}
          size="sm"
        />
        <View className="mx-1">
          <ArrowRightIcon size={18} color={color('primary')} />
        </View>
        <ParentRing
          role={creditor}
          initial={parentOf(family, creditor).initial}
          size="sm"
        />
      </View>
      <Text
        accessibilityRole="summary"
        className={`flex-1 font-extrabold text-text ${
          large ? 'text-[22px] leading-[28px]' : 'text-[20px] leading-[26px]'
        }`}
      >
        {text}
      </Text>
    </View>
  );
}

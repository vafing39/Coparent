import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Balance, Family } from '../../api/types';
import { Button } from '../../components/Button';
import { LoadError } from '../../components/LoadError';
import { BalanceSummary } from './BalanceSummary';

type Props = {
  family: Family;
  balance: Balance | undefined;
  error: Error | null;
  onRetry: () => void;
  onOpen: () => void;
};

/** Carte du solde de l'onglet Dépenses : qui doit combien, et « Détail et règlement ». */
export function BalanceCard({
  family,
  balance,
  error,
  onRetry,
  onOpen,
}: Props) {
  const { t } = useTranslation();
  let summary: React.ReactNode;
  if (error) {
    summary = (
      <LoadError message={t('expenses.balance.failed')} onRetry={onRetry} />
    );
  } else if (balance) {
    summary = <BalanceSummary family={family} balance={balance} />;
  } else {
    summary = (
      <View
        accessible
        accessibilityLabel={t('expenses.balance.loading')}
        className="h-9 rounded-xl bg-card"
      />
    );
  }
  return (
    <View className="gap-2.5 rounded-[20px] bg-primary-soft p-[18px]">
      <Text className="font-bold text-[13px] text-text">
        {t('expenses.balance.label')}
      </Text>
      {summary}
      <Text className="font-regular text-[13px] leading-[18px] text-text">
        {t('expenses.balance.note')}
      </Text>
      <View className="self-start">
        <Button label={t('expenses.balance.open')} onPress={onOpen} compact />
      </View>
    </View>
  );
}

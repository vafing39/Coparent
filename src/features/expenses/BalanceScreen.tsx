import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackHeader } from '../../components/BackHeader';
import { LoadError } from '../../components/LoadError';
import { ScreenSkeleton } from '../../components/ScreenSkeleton';
import { useExpenses } from '../../hooks/useExpenses';
import { useFamily } from '../../hooks/useFamily';
import type { AppScreenProps } from '../../navigation/types';
import { BalanceLines } from './BalanceLines';
import { BalanceSummary } from './BalanceSummary';
import { SettlementSection } from './SettlementSection';

/**
 * Solde courant, son calcul et son règlement. L'app n'effectue aucun paiement : elle garde la
 * trace des virements déclarés et confirmés.
 */
export function BalanceScreen({ navigation }: AppScreenProps<'Balance'>) {
  const { t } = useTranslation();
  const { family } = useFamily();
  const { balance, isLoadingBalance, balanceError, reloadBalance } =
    useExpenses();

  if (!family) {
    return null;
  }

  let content: React.ReactNode;
  if (balanceError) {
    content = (
      <LoadError
        message={t('expenses.balance.failed')}
        onRetry={reloadBalance}
      />
    );
  } else if (isLoadingBalance || !balance) {
    content = <ScreenSkeleton />;
  } else {
    content = (
      <ScrollView contentContainerClassName="gap-3 px-4 pt-1 pb-6">
        <View className="rounded-[20px] bg-primary-soft p-4">
          <BalanceSummary family={family} balance={balance} />
        </View>
        <BalanceLines family={family} balance={balance} />
        <SettlementSection family={family} balance={balance} />
        <Text className="mx-1 font-regular text-[13px] leading-[18px] text-text-secondary">
          {t('expenses.settle.note')}
        </Text>
      </ScrollView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <BackHeader
        title={t('expenses.settle.title')}
        onBack={() => navigation.goBack()}
      />
      {content}
    </SafeAreaView>
  );
}

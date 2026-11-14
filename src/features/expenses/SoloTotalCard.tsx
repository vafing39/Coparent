import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatEuros } from '../../api/expenses';

/** Mode solo : le total enregistré en attendant l'autre parent, sans solde. */
export function SoloTotalCard({
  totalCents,
  otherName,
}: {
  totalCents: number;
  otherName: string;
}) {
  const { t } = useTranslation();
  return (
    <View
      accessibilityLabel={t('expenses.solo.label')}
      className="gap-2 rounded-[20px] border-2 border-dashed border-parent-b bg-card p-4"
    >
      <Text className="font-bold text-[13px] text-text">
        {t('expenses.solo.title', { name: otherName })}
      </Text>
      <Text className="font-extrabold text-[26px] leading-[32px] text-text">
        {formatEuros(totalCents)}
      </Text>
      <Text className="font-regular text-[13px] leading-[18px] text-text">
        {t('expenses.solo.body', { name: otherName })}
      </Text>
    </View>
  );
}

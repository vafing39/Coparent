import React from 'react';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatEuros } from '../../../api/expenses';
import { Button } from '../../../components/Button';

/** Je dois le solde : je fais le virement, puis je le déclare ici. */
export function DeclareSettlement({
  amountCents,
  otherName,
  busy,
  onDeclare,
}: {
  amountCents: number;
  otherName: string;
  busy: boolean;
  onDeclare: () => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <Text className="font-regular text-[15px] leading-[21px] text-text">
        {t('expenses.settle.declareHint', { name: otherName })}
      </Text>
      <Button
        label={t('expenses.settle.declare', {
          amount: formatEuros(amountCents),
        })}
        compact
        loading={busy}
        onPress={onDeclare}
      />
    </>
  );
}

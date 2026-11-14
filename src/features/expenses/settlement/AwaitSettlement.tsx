import React from 'react';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';

/** L'autre parent me doit le solde : son virement sera déclaré ici. */
export function AwaitSettlement({ otherName }: { otherName: string }) {
  const { t } = useTranslation();
  return (
    <Text className="font-regular text-[15px] leading-[21px] text-text">
      {t('expenses.settle.waitDeclare', { name: otherName })}
    </Text>
  );
}

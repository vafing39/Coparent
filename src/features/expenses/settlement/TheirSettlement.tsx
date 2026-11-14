import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatEuros } from '../../../api/expenses';
import type { Settlement } from '../../../api/types';
import { Button } from '../../../components/Button';
import { formatDayMonth } from '../../../lib/dates';
import { PendingLine } from './StatusLine';

/**
 * L'autre parent a déclaré un virement : j'en confirme la réception, ou j'indique (une fois)
 * qu'il n'apparaît pas encore.
 */
export function TheirSettlement({
  settlement,
  otherName,
  busy,
  onConfirm,
  onNotReceived,
}: {
  settlement: Settlement;
  otherName: string;
  busy: boolean;
  onConfirm: () => void;
  onNotReceived: () => void;
}) {
  const { t } = useTranslation();
  const notReceived = settlement.status === 'NOT_RECEIVED';
  return (
    <>
      <PendingLine
        text={
          notReceived
            ? t('expenses.settle.notReceivedOther')
            : t('expenses.settle.declaredOther', {
                name: otherName,
                amount: formatEuros(settlement.amountCents),
                date: formatDayMonth(settlement.declaredAt),
              })
        }
      />
      <Button
        label={t('expenses.settle.confirm')}
        compact
        loading={busy}
        onPress={onConfirm}
      />
      {notReceived ? null : (
        <Button
          label={t('expenses.settle.notYet')}
          variant="neutral"
          compact
          disabled={busy}
          onPress={onNotReceived}
        />
      )}
    </>
  );
}

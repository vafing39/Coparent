import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatEuros } from '../../../api/expenses';
import type { Settlement } from '../../../api/types';
import { Button } from '../../../components/Button';
import { formatDayMonth } from '../../../lib/dates';
import { PendingLine } from './StatusLine';

/** J'ai déclaré un virement : il attend la confirmation de l'autre parent ; je peux l'annuler. */
export function MySettlement({
  settlement,
  otherName,
  busy,
  onCancel,
}: {
  settlement: Settlement;
  otherName: string;
  busy: boolean;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const amount = formatEuros(settlement.amountCents);
  return (
    <>
      <PendingLine
        text={
          settlement.status === 'NOT_RECEIVED'
            ? t('expenses.settle.notReceivedMine', { name: otherName, amount })
            : t('expenses.settle.declaredMine', {
                name: otherName,
                amount,
                date: formatDayMonth(settlement.declaredAt),
              })
        }
      />
      <Button
        label={t('expenses.settle.cancel')}
        variant="neutral"
        compact
        loading={busy}
        onPress={onCancel}
      />
    </>
  );
}

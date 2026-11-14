import React from 'react';
import { useTranslation } from 'react-i18next';
import { expenseErrorMessage, nameOf, otherRole } from '../../api/expenses';
import type { Balance, Family } from '../../api/types';
import { ErrorText } from '../../components/ErrorText';
import { SectionCard } from '../../components/SectionCard';
import { useExpenses } from '../../hooks/useExpenses';
import { AwaitSettlement } from './settlement/AwaitSettlement';
import { DeclareSettlement } from './settlement/DeclareSettlement';
import { MySettlement } from './settlement/MySettlement';
import { NothingToSettle } from './settlement/NothingToSettle';
import { TheirSettlement } from './settlement/TheirSettlement';

/**
 * « Règlement » : le débiteur déclare son virement (ou l'annule) ; le créancier en confirme la
 * réception, ou indique qu'il ne l'a pas encore reçu.
 */
export function SettlementSection({
  family,
  balance,
}: {
  family: Family;
  balance: Balance;
}) {
  const { t } = useTranslation();
  const {
    declareSettlement,
    isDeclaringSettlement,
    declareSettlementError,
    answerSettlement,
    isAnsweringSettlement,
    answerSettlementError,
  } = useExpenses();
  const other = nameOf(family, otherRole(family.myRole));
  const open = balance.openSettlement;
  const error = declareSettlementError ?? answerSettlementError;

  let content: React.ReactNode;
  if (open?.mine) {
    content = (
      <MySettlement
        settlement={open}
        otherName={other}
        busy={isAnsweringSettlement}
        onCancel={() => answerSettlement({ id: open.id, action: 'cancel' })}
      />
    );
  } else if (open) {
    content = (
      <TheirSettlement
        settlement={open}
        otherName={other}
        busy={isAnsweringSettlement}
        onConfirm={() => answerSettlement({ id: open.id, action: 'confirm' })}
        onNotReceived={() =>
          answerSettlement({ id: open.id, action: 'not-received' })
        }
      />
    );
  } else if (!balance.debtorRole) {
    content = <NothingToSettle />;
  } else if (balance.debtorRole === family.myRole) {
    content = (
      <DeclareSettlement
        amountCents={balance.amountCents}
        otherName={other}
        busy={isDeclaringSettlement}
        onDeclare={() => declareSettlement(balance.amountCents)}
      />
    );
  } else {
    content = <AwaitSettlement otherName={other} />;
  }

  return (
    <SectionCard title={t('expenses.settle.section')}>
      {content}
      {error ? <ErrorText text={expenseErrorMessage(error)} /> : null}
    </SectionCard>
  );
}

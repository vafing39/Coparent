import i18n from '../../i18n';
import { nameOf, otherRole, splitLabel } from '../../api/expenses';
import type { Expense, Family } from '../../api/types';
import { joinNames } from '../../lib/text';

/** « Léa et Hugo ». */
export function childrenText(expense: Expense): string {
  return joinNames(expense.children.map(child => child.firstName));
}

/** « 50/50 », « Camille 70 % · Julien 30 % »… selon qui a payé. */
export function expenseSplit(family: Family, expense: Expense): string {
  return splitLabel(
    expense.payerSharePercent,
    nameOf(family, expense.payerRole),
    nameOf(family, otherRole(expense.payerRole)),
  );
}

/** « Léa et Hugo · 50/50 · payée par Julien ». */
export function expenseMeta(family: Family, expense: Expense): string {
  return i18n.t('expenses.list.meta', {
    children: childrenText(expense),
    split: expenseSplit(family, expense),
    payer: nameOf(family, expense.payerRole),
  });
}

/** Où en est la dépense, vue par moi. */
export function expenseStatus(family: Family, expense: Expense): string {
  const other = nameOf(family, otherRole(family.myRole));
  switch (expense.status) {
    case 'PENDING':
      if (family.solo) {
        return i18n.t('expenses.status.toPropose', { name: other });
      }
      return expense.mine
        ? i18n.t('expenses.status.waiting', { name: other })
        : i18n.t('expenses.status.toAnswer');
    case 'CONTESTED':
      return expense.mine
        ? i18n.t('expenses.status.contestedBy', { name: other })
        : i18n.t('expenses.status.contestedByYou');
    default:
      return i18n.t('expenses.status.validated');
  }
}

/** « Motif : Le montant ne correspond pas « La facture indique 21 repas. » », null sans contestation. */
export function contestText(expense: Expense): string | null {
  if (expense.status !== 'CONTESTED' || !expense.contestReason) {
    return null;
  }
  const reason = i18n.t(`expenses.contest.reasons.${expense.contestReason}`);
  return expense.contestNote
    ? i18n.t('expenses.reasonNote', { reason, note: expense.contestNote })
    : i18n.t('expenses.reasonLine', { reason });
}

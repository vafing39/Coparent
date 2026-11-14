import { z } from 'zod';
import type { ParseKeys } from 'i18next';
import i18n from '../i18n';
import { MAX_AMOUNT_CENTS, parseAmount } from '../api/expenses';

// Messages résolus à l'affichage (fonction), pour suivre la langue active.
const msg =
  (key: ParseKeys, options: Record<string, string | number> = {}) =>
  () =>
    i18n.t(key, options);

export const EXPENSE_LABEL_MAX_LENGTH = 120;
export const CONTEST_NOTE_MAX_LENGTH = 500;

/**
 * Nouvelle dépense ou correction. `amount` : la saisie (« 64,20 »), convertie en centimes à
 * l'envoi ; `paidOn` : « AAAA-MM-JJ », jusqu'à `today` compris. Le serveur vérifie le reste.
 */
export function expenseSchema(today: string) {
  return z.object({
    label: z
      .string()
      .trim()
      .min(1, { error: msg('expenses.form.labelRequired') })
      .max(EXPENSE_LABEL_MAX_LENGTH, {
        error: msg('expenses.form.labelTooLong', {
          max: EXPENSE_LABEL_MAX_LENGTH,
        }),
      }),
    amount: z
      .string()
      .refine(text => (parseAmount(text) ?? 0) > 0, {
        error: msg('expenses.form.amountInvalid'),
      })
      .refine(text => (parseAmount(text) ?? 0) <= MAX_AMOUNT_CENTS, {
        error: msg('expenses.form.amountTooHigh'),
      }),
    category: z.enum([
      'HEALTH',
      'SCHOOL',
      'CANTEEN',
      'ACTIVITIES',
      'CLOTHING',
      'OTHER',
    ]),
    childIds: z
      .array(z.string())
      .min(1, { error: msg('expenses.form.childrenRequired') }),
    payerRole: z.enum(['PARENT_A', 'PARENT_B']),
    paidOn: z
      .string()
      .refine(date => date <= today, { error: msg('expenses.form.future') }),
    payerSharePercent: z.number(),
  });
}

export type ExpenseValues = z.output<ReturnType<typeof expenseSchema>>;

/** Contestation : un motif, une précision facultative. */
export const contestSchema = z.object({
  reason: z.enum(['AMOUNT', 'RECEIPT', 'NOT_AGREED', 'OTHER']),
  note: z
    .string()
    .trim()
    .max(CONTEST_NOTE_MAX_LENGTH, {
      error: msg('expenses.contest.tooLong', { max: CONTEST_NOTE_MAX_LENGTH }),
    }),
});

export type ContestValues = z.output<typeof contestSchema>;

import { z } from 'zod';
import type { ParseKeys } from 'i18next';
import i18n from '../i18n';

// Messages résolus à l'affichage (fonction), pour suivre la langue active.
const msg =
  (key: ParseKeys, options: Record<string, string | number> = {}) =>
  () =>
    i18n.t(key, options);

export const EXCHANGE_MAX_NIGHTS = 31;
export const EXCHANGE_MESSAGE_MAX_LENGTH = 500;

/** Nombre de nuits de `from` à `to` (« AAAA-MM-JJ », incluses). */
function nights(from: string, to: string): number {
  return (
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86400000 +
    1
  );
}

/**
 * Demande d'échange : je prends `takeFrom`..`takeTo`, et en option je laisse `giveFrom`..`giveTo`.
 * Dates « AAAA-MM-JJ » : les comparer comme du texte suit l'ordre des jours. Le serveur vérifie
 * le reste (nuits chez le bon parent, à partir de demain, pas déjà échangées).
 */
export const exchangeSchema = z
  .object({
    takeFrom: z.string(),
    takeTo: z.string(),
    give: z.boolean(),
    giveFrom: z.string(),
    giveTo: z.string(),
    message: z
      .string()
      .trim()
      .max(EXCHANGE_MESSAGE_MAX_LENGTH, {
        error: msg('exchanges.form.tooLong', {
          max: EXCHANGE_MESSAGE_MAX_LENGTH,
        }),
      }),
  })
  .refine(v => v.takeTo >= v.takeFrom, {
    path: ['takeTo'],
    error: msg('exchanges.form.endBeforeStart'),
  })
  .refine(v => nights(v.takeFrom, v.takeTo) <= EXCHANGE_MAX_NIGHTS, {
    path: ['takeTo'],
    error: msg('exchanges.form.tooManyNights', { max: EXCHANGE_MAX_NIGHTS }),
  })
  .refine(v => !v.give || v.giveTo >= v.giveFrom, {
    path: ['giveTo'],
    error: msg('exchanges.form.endBeforeStart'),
  })
  .refine(v => !v.give || nights(v.giveFrom, v.giveTo) <= EXCHANGE_MAX_NIGHTS, {
    path: ['giveTo'],
    error: msg('exchanges.form.tooManyNights', { max: EXCHANGE_MAX_NIGHTS }),
  })
  .refine(v => !v.give || v.giveFrom > v.takeTo || v.takeFrom > v.giveTo, {
    path: ['giveFrom'],
    error: msg('exchanges.form.overlap'),
  });

export type ExchangeValues = z.output<typeof exchangeSchema>;

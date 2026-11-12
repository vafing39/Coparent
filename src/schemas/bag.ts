import { z } from 'zod';
import type { ParseKeys } from 'i18next';
import i18n from '../i18n';

// Messages résolus à l'affichage (fonction), pour suivre la langue active.
const msg =
  (key: ParseKeys, options: Record<string, string | number> = {}) =>
  () =>
    i18n.t(key, options);

const LABEL_MAX_LENGTH = 100;

/** Nouvel élément du sac (« Kimono »), pour l'enfant choisi. */
export const bagItemSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, { error: msg('home.bag.label.required') })
    .max(LABEL_MAX_LENGTH, {
      error: msg('home.bag.label.tooLong', { max: LABEL_MAX_LENGTH }),
    }),
});

export type BagItemInput = z.input<typeof bagItemSchema>;
export type BagItemValues = z.output<typeof bagItemSchema>;

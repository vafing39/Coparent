import { z } from 'zod';
import type { ParseKeys } from 'i18next';
import i18n from '../i18n';
import { parseDisplayDate, todayInParis } from '../lib/dates';

// Messages résolus à l'affichage (fonction), pour suivre la langue active.
const msg =
  (key: ParseKeys, options: Record<string, string | number> = {}) =>
  () =>
    i18n.t(key, options);

const FIRST_NAME_MAX_LENGTH = 100;
const MIN_BIRTH_DATE = '1900-01-01';

/** Un enfant de l'étape 3. childId : présent si l'enfant est déjà enregistré. */
export const childSchema = z.object({
  childId: z.string().optional(),
  firstName: z
    .string()
    .trim()
    .min(1, { error: msg('onboarding.children.firstName.required') })
    .max(FIRST_NAME_MAX_LENGTH, {
      error: msg('onboarding.children.firstName.tooLong', {
        max: FIRST_NAME_MAX_LENGTH,
      }),
    }),
  // Saisie « jj/mm/aaaa », envoyée au backend en « AAAA-MM-JJ ».
  birthDate: z
    .string()
    .trim()
    .min(1, {
      error: msg('onboarding.children.birthDate.required'),
      abort: true,
    })
    .refine(value => parseDisplayDate(value) !== null, {
      error: msg('onboarding.children.birthDate.invalid'),
      abort: true,
    })
    .refine(value => (parseDisplayDate(value) ?? '') >= MIN_BIRTH_DATE, {
      error: msg('onboarding.children.birthDate.invalid'),
      abort: true,
    })
    .refine(value => (parseDisplayDate(value) ?? '') <= todayInParis(), {
      error: msg('onboarding.children.birthDate.future'),
    })
    .transform(value => parseDisplayDate(value) as string),
});

/** Étape 3 : au moins un enfant. */
export const childrenSchema = z.object({
  children: z
    .array(childSchema)
    .min(1, { error: msg('onboarding.children.atLeastOne') }),
});

export type ChildInput = z.input<typeof childSchema>;
export type ChildValues = z.output<typeof childSchema>;
export type ChildrenInput = z.input<typeof childrenSchema>;
export type ChildrenValues = z.output<typeof childrenSchema>;

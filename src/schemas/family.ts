import { z } from 'zod';
import type { ParseKeys } from 'i18next';
import i18n from '../i18n';

// Messages résolus à l'affichage (fonction), pour suivre la langue active.
const msg =
  (key: ParseKeys, options: Record<string, string | number> = {}) =>
  () =>
    i18n.t(key, options);

/** Zones de vacances scolaires (cahier des charges §2.2). */
export const VACATION_ZONES = ['A', 'B', 'C', 'OTHER'] as const;
export type VacationZone = (typeof VACATION_ZONES)[number];

const FAMILY_NAME_MAX_LENGTH = 100;

/** Étape 2 de la première connexion : nom de la famille et zone de vacances. */
export const familySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: msg('onboarding.family.name.required') })
    .max(FAMILY_NAME_MAX_LENGTH, {
      error: msg('onboarding.family.name.tooLong', {
        max: FAMILY_NAME_MAX_LENGTH,
      }),
    }),
  // Aucune zone par défaut : une mauvaise zone fausserait le partage des vacances.
  // Le formulaire démarre sans valeur (undefined) : le message s'affiche si rien n'est choisi.
  zone: z.enum(VACATION_ZONES, {
    error: msg('onboarding.family.zone.required'),
  }),
});

export type FamilyInput = z.input<typeof familySchema>;
export type FamilyValues = z.output<typeof familySchema>;

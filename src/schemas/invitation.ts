import { z } from 'zod';
import type { ParseKeys } from 'i18next';
import i18n from '../i18n';

// Messages résolus à l'affichage (fonction), pour suivre la langue active.
const msg =
  (key: ParseKeys, options: Record<string, string | number> = {}) =>
  () =>
    i18n.t(key, options);

const FIRST_NAME_MAX_LENGTH = 100;

/** Étape 5 : prénom de l'autre parent (affiché dans l'invitation). */
export const invitationSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, { error: msg('onboarding.invitation.firstName.required') })
    .max(FIRST_NAME_MAX_LENGTH, {
      error: msg('onboarding.invitation.firstName.tooLong', {
        max: FIRST_NAME_MAX_LENGTH,
      }),
    }),
});

export type InvitationInput = z.input<typeof invitationSchema>;
export type InvitationValues = z.output<typeof invitationSchema>;

import type { ParseKeys } from 'i18next';
import { z } from 'zod';
import i18n from '../i18n';
import { signupSchema } from './auth';

const msg = (key: ParseKeys) => () => i18n.t(key);

/** « Modifier le mot de passe » : l'actuel, puis le nouveau deux fois (règles de l'inscription). */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { error: msg('account.password.current.required') }),
    newPassword: signupSchema.shape.password,
    confirmPassword: signupSchema.shape.confirmPassword,
  })
  .refine(values => values.newPassword === values.confirmPassword, {
    error: msg('fields.confirmPassword.mismatch'),
    path: ['confirmPassword'],
  });

export type ChangePasswordInput = z.input<typeof changePasswordSchema>;
export type ChangePasswordValues = z.output<typeof changePasswordSchema>;

/** « Supprimer mon compte » : le mot de passe, saisi à nouveau pour confirmer. */
export const deleteAccountSchema = z.object({
  password: z.string().min(1, { error: msg('fields.password.required') }),
});

export type DeleteAccountInput = z.input<typeof deleteAccountSchema>;
export type DeleteAccountValues = z.output<typeof deleteAccountSchema>;

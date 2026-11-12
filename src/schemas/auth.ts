import { z } from 'zod';
import type { ParseKeys } from 'i18next';
import i18n from '../i18n';

// Messages résolus à l'affichage (fonction), pour suivre la langue active.
const msg =
  (key: ParseKeys, options: Record<string, string | number> = {}) =>
  () =>
    i18n.t(key, options);

/**
 * Connexion : seul le format est vérifié ici. La règle des 12 caractères
 * s'applique à la création du mot de passe, pas à la connexion.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { error: msg('fields.email.required') })
    .pipe(z.email({ error: msg('fields.email.invalid') })),
  password: z.string().min(1, { error: msg('fields.password.required') }),
});

export type LoginInput = z.input<typeof loginSchema>;
export type LoginValues = z.output<typeof loginSchema>;

export const PASSWORD_MIN_LENGTH = 12;
const FIRST_NAME_MAX_LENGTH = 100;

/**
 * Inscription. Le backend applique les mêmes règles (et refuse en plus les mots
 * de passe connus comme compromis) : ce schéma sert au retour immédiat.
 */
export const signupSchema = z
  .object({
    email: loginSchema.shape.email,
    firstName: z
      .string()
      .trim()
      .min(1, { error: msg('fields.firstName.required') })
      .max(FIRST_NAME_MAX_LENGTH, {
        error: msg('fields.firstName.tooLong', { max: FIRST_NAME_MAX_LENGTH }),
      }),
    password: z
      .string()
      .refine(value => [...value].length >= PASSWORD_MIN_LENGTH, {
        error: msg('fields.password.minLength', { min: PASSWORD_MIN_LENGTH }),
      }),
    confirmPassword: z
      .string()
      .min(1, { error: msg('fields.confirmPassword.required') }),
  })
  .refine(values => values.password === values.confirmPassword, {
    error: msg('fields.confirmPassword.mismatch'),
    path: ['confirmPassword'],
  });

export type SignupInput = z.input<typeof signupSchema>;
export type SignupValues = z.output<typeof signupSchema>;

/** Mot de passe oublié, étape 1 : l'adresse du compte. */
export const forgotPasswordSchema = z.object({
  email: loginSchema.shape.email,
});

export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>;
export type ForgotPasswordValues = z.output<typeof forgotPasswordSchema>;

export const RESET_CODE_LENGTH = 8;

/**
 * Mot de passe oublié, étape 2 : code reçu par email et nouveau mot de passe (mêmes règles
 * qu'à l'inscription). L'adresse vient de l'étape 1.
 */
export const resetPasswordFormSchema = z
  .object({
    code: z
      .string()
      .min(1, { error: msg('forgotPassword.code.required') })
      .regex(new RegExp(`^\\d{${RESET_CODE_LENGTH}}$`), {
        error: msg('forgotPassword.code.tooShort', {
          length: RESET_CODE_LENGTH,
        }),
      }),
    newPassword: signupSchema.shape.password,
    confirmPassword: signupSchema.shape.confirmPassword,
  })
  .refine(values => values.newPassword === values.confirmPassword, {
    error: msg('fields.confirmPassword.mismatch'),
    path: ['confirmPassword'],
  });

export type ResetPasswordFormInput = z.input<typeof resetPasswordFormSchema>;
export type ResetPasswordFormValues = z.output<typeof resetPasswordFormSchema>;

/** Corps envoyé au serveur. */
export type ResetPasswordValues = ResetPasswordFormValues & { email: string };

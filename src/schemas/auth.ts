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

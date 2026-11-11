import { z } from 'zod';

/**
 * Connexion : seul le format est vérifié ici. La règle des 12 caractères
 * s'applique à la création du mot de passe, pas à la connexion.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { error: 'Saisissez votre adresse email.' })
    .pipe(
      z.email({
        error: 'Adresse email invalide, par exemple vous@exemple.fr.',
      }),
    ),
  password: z.string().min(1, { error: 'Saisissez votre mot de passe.' }),
});

export type LoginInput = z.input<typeof loginSchema>;
export type LoginValues = z.output<typeof loginSchema>;

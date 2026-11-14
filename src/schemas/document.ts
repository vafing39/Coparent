import { z } from 'zod';
import type { ParseKeys } from 'i18next';
import i18n from '../i18n';

const msg =
  (key: ParseKeys, options: Record<string, string | number> = {}) =>
  () =>
    i18n.t(key, options);

export const DOCUMENT_TITLE_MAX_LENGTH = 120;

/** Nouveau document : nom, catégorie, enfant (null : tous). Le fichier est choisi à part. */
export const documentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { error: msg('documents.form.titleRequired') })
    .max(DOCUMENT_TITLE_MAX_LENGTH, {
      error: msg('documents.form.titleTooLong', {
        max: DOCUMENT_TITLE_MAX_LENGTH,
      }),
    }),
  category: z.enum(['SCHOOL', 'INSURANCE', 'IDENTITY', 'JUDGMENT', 'OTHER']),
  childId: z.string().nullable(),
});

export type DocumentValues = z.infer<typeof documentSchema>;

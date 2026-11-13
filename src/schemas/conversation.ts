import { z } from 'zod';
import type { ParseKeys } from 'i18next';
import i18n from '../i18n';

// Messages résolus à l'affichage (fonction), pour suivre la langue active.
const msg =
  (key: ParseKeys, options: Record<string, string | number> = {}) =>
  () =>
    i18n.t(key, options);

const SUBJECT_MAX_LENGTH = 80;
const BODY_MAX_LENGTH = 2000;

/** Nouvelle discussion : sujet et premier message (mêmes limites que le backend). */
export const conversationSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(1, { error: msg('messages.new.subjectRequired') })
    .max(SUBJECT_MAX_LENGTH, {
      error: msg('messages.new.tooLong', { max: SUBJECT_MAX_LENGTH }),
    }),
  body: z
    .string()
    .trim()
    .min(1, { error: msg('messages.new.bodyRequired') })
    .max(BODY_MAX_LENGTH, {
      error: msg('messages.new.tooLong', { max: '2 000' }),
    }),
});

export type ConversationValues = z.output<typeof conversationSchema>;

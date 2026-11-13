import { z } from 'zod';
import type { ParseKeys } from 'i18next';
import i18n from '../i18n';

// Messages résolus à l'affichage (fonction), pour suivre la langue active.
const msg =
  (key: ParseKeys, options: Record<string, string | number> = {}) =>
  () =>
    i18n.t(key, options);

const TITLE_MAX_LENGTH = 100;
const LOCATION_MAX_LENGTH = 200;

/**
 * Formulaire d'un événement. `date` « AAAA-MM-JJ », heures « HH:mm » (Paris), ignorées pour
 * une journée entière. Comparer « HH:mm » comme du texte suit l'ordre des heures.
 */
export const eventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, { error: msg('events.title.required') })
      .max(TITLE_MAX_LENGTH, {
        error: msg('events.title.tooLong', { max: TITLE_MAX_LENGTH }),
      }),
    type: z.enum(['APPOINTMENT', 'ACTIVITY', 'SCHOOL', 'OTHER']),
    childIds: z
      .array(z.string())
      .min(1, { error: msg('events.children.required') }),
    allDay: z.boolean(),
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    location: z
      .string()
      .trim()
      .max(LOCATION_MAX_LENGTH, {
        error: msg('events.location.tooLong', { max: LOCATION_MAX_LENGTH }),
      }),
    reminder: z.enum(['NONE', 'ONE_HOUR', 'DAY_BEFORE', 'TWO_DAYS']),
    visibility: z.enum(['SHARED', 'PRIVATE']),
  })
  .refine(values => values.allDay || values.endTime > values.startTime, {
    path: ['endTime'],
    error: msg('events.endBeforeStart'),
  });

export type EventInput = z.input<typeof eventSchema>;
export type EventValues = z.output<typeof eventSchema>;

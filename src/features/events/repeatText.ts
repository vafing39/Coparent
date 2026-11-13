import i18n from '../../i18n';
import type {
  CalendarEvent,
  EventRepeat,
  Family,
  RepeatFrequency,
} from '../../api/types';
import { calendarDay, formatShortDate, isoWeekday } from '../../lib/dates';
import { joinNames } from '../../lib/text';
import { parentOf } from '../custody/parents';

/** Fréquence proposée dans « Répéter » : les quatre de la série, ou « Jamais ». */
export type FrequencyChoice = RepeatFrequency | 'NONE';

/** « Chaque semaine, le jeudi », « Chaque mois, le 19 »… à partir de la première séance. */
export function frequencyLabel(
  frequency: FrequencyChoice,
  date: string,
): string {
  switch (frequency) {
    case 'WEEKLY':
    case 'BIWEEKLY':
      return i18n.t(`events.repeat.${frequency}`, {
        weekday: i18n.t(
          `weekdays.long.${isoWeekday(date) as 1 | 2 | 3 | 4 | 5 | 6 | 7}`,
        ),
      });
    case 'MONTHLY':
      return i18n.t('events.repeat.MONTHLY', {
        day: calendarDay(date).date(),
      });
    default:
      return i18n.t(`events.repeat.${frequency}`);
  }
}

/** « Hugo », « Léa et Hugo », ou « les enfants » si aucun n'est choisi. */
export function childrenNames(names: string[]): string {
  return names.length > 0
    ? joinNames(names)
    : i18n.t('events.repeat.theChildren');
}

/** Accord du verbe : « Hugo est », « les enfants sont ». */
export function childrenCount(names: string[]): number {
  return names.length === 1 ? 1 : 2;
}

/**
 * Résumé d'une série : « Chaque semaine, le jeudi, seulement quand Hugo est chez Julien ·
 * hors vacances · jusqu'au jeu. 2 juil. ».
 */
export function repeatSummary(
  repeat: NonNullable<CalendarEvent['repeat']> | EventRepeat,
  firstDate: string,
  family: Family,
  childNames: string[],
): string {
  let rule = frequencyLabel(repeat.frequency, firstDate);
  if (repeat.onlyWith) {
    rule += `, ${i18n.t('events.repeat.summaryWith', {
      count: childrenCount(childNames),
      names: childrenNames(childNames),
      name: parentOf(family, repeat.onlyWith).name,
    })}`;
  }
  const parts = [rule];
  if (repeat.skipHolidays) {
    parts.push(i18n.t('events.repeat.summaryHolidays'));
  }
  const until = 'until' in repeat ? repeat.until : null;
  if (repeat.end === 'COUNT' && repeat.count !== null) {
    parts.push(i18n.t('events.repeat.summaryCount', { count: repeat.count }));
  }
  if (until) {
    parts.push(
      i18n.t('events.repeat.summaryUntil', { date: formatShortDate(until) }),
    );
  }
  return parts.join(' · ');
}

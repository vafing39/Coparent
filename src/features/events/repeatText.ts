import i18n from '../../i18n';
import type {
  CalendarEvent,
  EventRepeat,
  Family,
  RepeatDay,
  RepeatFrequency,
  RepeatMonthMode,
  RepeatUnit,
  Weekday,
} from '../../api/types';
import {
  calendarDay,
  formatShortDate,
  formatTime,
  isoWeekday,
} from '../../lib/dates';
import { joinNames } from '../../lib/text';
import { parentOf } from '../custody/parents';

/** Fréquence proposée dans « Répéter » : celles de la série, ou « Jamais ». */
export type FrequencyChoice = RepeatFrequency | 'NONE';

/** Du lundi au dimanche (jour ISO 1 à 7). */
export const WEEKDAYS: Weekday[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

type IsoDay = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Jour ISO (1 lundi … 7 dimanche) d'un jour de la semaine. */
export function isoDayOf(day: Weekday): IsoDay {
  return (WEEKDAYS.indexOf(day) + 1) as IsoDay;
}

/** Jour de la semaine d'une date « AAAA-MM-JJ ». */
export function weekdayOf(date: string): Weekday {
  return WEEKDAYS[isoWeekday(date) - 1];
}

/** « lundi », « mercredi »… */
export function weekdayName(day: Weekday): string {
  return i18n.t(`weekdays.long.${isoDayOf(day)}`);
}

/** Les jours dans l'ordre de la semaine. */
export function sortDays(days: RepeatDay[]): RepeatDay[] {
  return [...days].sort(
    (a, b) => isoDayOf(a.dayOfWeek) - isoDayOf(b.dayOfWeek),
  );
}

/** Rang du jour de la date dans son mois : 1 à 4, ou 5 pour « le dernier ». */
export function weekdayRank(date: string): 1 | 2 | 3 | 4 | 5 {
  return Math.min(5, Math.floor((calendarDay(date).date() - 1) / 7) + 1) as
    | 1
    | 2
    | 3
    | 4
    | 5;
}

/** « Le 19 de chaque mois », « Le troisième jeudi du mois ». */
export function monthModeLabel(mode: RepeatMonthMode, date: string): string {
  return mode === 'DAY_OF_MONTH'
    ? i18n.t('events.repeat.custom.dayOfMonth', {
        day: calendarDay(date).date(),
      })
    : i18n.t('events.repeat.custom.weekdayOfMonth', {
        rank: i18n.t(`events.repeat.custom.ranks.${weekdayRank(date)}`),
        weekday: i18n.t(`weekdays.long.${isoWeekday(date) as IsoDay}`),
      });
}

/** Règle personnalisée, sans le filtre ni la fin. */
export type CustomRule = {
  interval: number;
  unit: RepeatUnit;
  monthMode: RepeatMonthMode | null;
  days: RepeatDay[];
};

/**
 * « Tous les 3 jours », « Toutes les 2 semaines, le lundi et le mercredi » (avec l'heure de
 * chaque jour quand elle diffère), « Chaque mois, le troisième jeudi ».
 */
export function customLabel(rule: CustomRule, date: string): string {
  const every = i18n.t(`events.repeat.custom.every.${rule.unit}`, {
    count: rule.interval,
  });
  switch (rule.unit) {
    case 'DAY':
      return every;
    case 'MONTH':
      return `${every}, ${
        rule.monthMode === 'WEEKDAY_OF_MONTH'
          ? i18n.t('events.repeat.custom.onWeekdayOfMonth', {
              rank: i18n.t(`events.repeat.custom.ranks.${weekdayRank(date)}`),
              weekday: i18n.t(`weekdays.long.${isoWeekday(date) as IsoDay}`),
            })
          : i18n.t('events.repeat.custom.onDay', {
              day: calendarDay(date).date(),
            })
      }`;
    case 'WEEK': {
      const days = sortDays(rule.days);
      const ownTimes = days.some(day => day.startTime !== null);
      return `${every}, ${joinNames(
        days.map(day =>
          ownTimes && day.startTime
            ? i18n.t('events.repeat.custom.onWeekdayAt', {
                weekday: weekdayName(day.dayOfWeek),
                time: formatTime(day.startTime),
              })
            : i18n.t('events.repeat.custom.onWeekday', {
                weekday: weekdayName(day.dayOfWeek),
              }),
        ),
      )}`;
    }
  }
}

/** La règle personnalisée d'une répétition, si c'en est une. */
export function customRuleOf(
  repeat: Pick<
    EventRepeat,
    'frequency' | 'interval' | 'unit' | 'monthMode' | 'days'
  >,
): CustomRule | null {
  if (repeat.frequency !== 'CUSTOM' || !repeat.interval || !repeat.unit) {
    return null;
  }
  return {
    interval: repeat.interval,
    unit: repeat.unit,
    monthMode: repeat.monthMode,
    days: repeat.days,
  };
}

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
  const custom = customRuleOf(repeat);
  let rule = custom
    ? customLabel(custom, firstDate)
    : frequencyLabel(repeat.frequency, firstDate);
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

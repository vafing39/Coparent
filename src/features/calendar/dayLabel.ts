import i18n from '../../i18n';
import type { Family } from '../../api/types';
import {
  formatLongDate,
  formatTime,
  splitLocalDateTime,
} from '../../lib/dates';
import { parentOf } from '../custody/parents';
import type { CalendarDay } from './calendarDays';

/**
 * Libellé lu par le lecteur d'écran pour un jour : « vendredi 13 novembre, passage de garde
 * de Julien à Camille à 17 h 50 », précédé de « Aujourd'hui » et suivi des vacances et des
 * événements (« Judo, partagé »).
 */
export function dayLabel(
  family: Family,
  day: CalendarDay,
  today: string,
): string {
  const date = formatLongDate(day.date);
  let label = date;
  if (day.handover) {
    label = i18n.t('calendar.cell.handoverAt', {
      date,
      from: parentOf(family, day.handover.from).name,
      to: parentOf(family, day.handover.to).name,
      time: formatTime(splitLocalDateTime(day.handover.at).time),
    });
  } else if (day.parent) {
    label = i18n.t('calendar.cell.at', {
      date,
      name: parentOf(family, day.parent).name,
    });
  }
  if (day.holiday) {
    label = `${label}, ${day.holiday}`;
  }
  for (const event of day.events) {
    label = `${label}, ${i18n.t(
      event.visibility === 'SHARED'
        ? 'calendar.eventShared'
        : 'calendar.eventPrivate',
      { title: event.title },
    )}`;
  }
  return day.date === today ? i18n.t('calendar.todayLabel', { label }) : label;
}

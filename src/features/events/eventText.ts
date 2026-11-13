import i18n from '../../i18n';
import type { CalendarEvent } from '../../api/types';
import { formatTime } from '../../lib/dates';

/** « 17 h 00 – 17 h 45 », ou « Toute la journée ». */
export function eventTime(event: CalendarEvent): string {
  if (event.allDay || !event.startTime || !event.endTime) {
    return i18n.t('events.allDayShort');
  }
  return i18n.t('events.timeRange', {
    start: formatTime(event.startTime.slice(0, 5)),
    end: formatTime(event.endTime.slice(0, 5)),
  });
}

/** Clé de tri « AAAA-MM-JJTHH:mm » (une journée entière passe en tête du jour). */
export function eventSortKey(event: CalendarEvent): string {
  return `${event.date}T${
    event.allDay ? '00:00' : (event.startTime ?? '00:00').slice(0, 5)
  }`;
}

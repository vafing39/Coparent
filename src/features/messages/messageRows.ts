import i18n from '../../i18n';
import type { Message } from '../../api/types';
import { addDays } from '../calendar/calendarDays';
import { formatShortDate, parisDayOf, todayInParis } from '../../lib/dates';

/** Une ligne de la conversation : un séparateur de jour ou un message. */
export type MessageRow =
  | { kind: 'day'; key: string; label: string }
  | { kind: 'message'; key: string; message: Message };

/** « Aujourd'hui », « Hier », sinon « mar. 10 nov. ». */
export function dayLabel(day: string, today: string): string {
  if (day === today) {
    return i18n.t('messages.today');
  }
  if (day === addDays(today, -1)) {
    return i18n.t('messages.yesterday');
  }
  return formatShortDate(day);
}

/**
 * Messages (du plus ancien au plus récent) avec un séparateur avant le premier message de
 * chaque jour de Paris. Renvoyées du plus récent au plus ancien, pour une liste inversée.
 */
export function messageRows(
  messages: Message[],
  now: Date = new Date(),
): MessageRow[] {
  const today = todayInParis(now);
  const rows: MessageRow[] = [];
  let previousDay: string | null = null;
  for (const message of messages) {
    const day = parisDayOf(message.createdAt);
    if (day !== previousDay) {
      rows.push({
        kind: 'day',
        key: `day-${day}`,
        label: dayLabel(day, today),
      });
      previousDay = day;
    }
    rows.push({ kind: 'message', key: message.id, message });
  }
  return rows.reverse();
}

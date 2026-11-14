import dayjs from './dayjs';

/** Fuseau de référence de l'app (CLAUDE.md, règle 5). */
export const APP_TIME_ZONE = 'Europe/Paris';

/** Format des dates sans heure ni fuseau échangées avec le backend. */
export const ISO_DATE = 'YYYY-MM-DD';

/**
 * Une date « AAAA-MM-JJ » comme jour de calendrier : lue en UTC, où il n'y a pas de changement
 * d'heure, pour que les calculs de jours ne glissent jamais.
 */
export function calendarDay(isoDate: string) {
  return dayjs.utc(isoDate, ISO_DATE);
}

const PARIS_PARTS = new Intl.DateTimeFormat('en-GB', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

/**
 * Heure murale de Paris à l'instant `instant`, en objet Day.js sans fuseau (lu en UTC).
 * N'utilise pas `dayjs().tz()` : ce plugin relit un texte « 11/13/2026, 2:22:00 PM » que
 * Hermes (le moteur JavaScript de l'app) ne sait pas analyser, d'où « Invalid Date » sur le
 * téléphone alors que Jest (Node) passe.
 */
export function inParis(instant: Date | string = new Date()) {
  const date = typeof instant === 'string' ? new Date(instant) : instant;
  const part: Record<string, string> = {};
  for (const { type, value } of PARIS_PARTS.formatToParts(date)) {
    part[type] = value;
  }
  return dayjs.utc(
    `${part.year}-${part.month}-${part.day}T${part.hour}:${part.minute}:${part.second}`,
  );
}

/** Date du jour à Paris, au format « AAAA-MM-JJ ». */
export function todayInParis(now: Date = new Date()): string {
  return inParis(now).format(ISO_DATE);
}

/** « jj/mm/aaaa » → « AAAA-MM-JJ », ou null si la date n'existe pas (ex. 31/02). */
export function parseDisplayDate(text: string): string | null {
  // Analyse stricte : refuse « 1/2/2020 » comme « 31/02/2020 ».
  const date = dayjs.utc(text.trim(), 'DD/MM/YYYY', true);
  return date.isValid() ? date.format(ISO_DATE) : null;
}

/** « AAAA-MM-JJ » → « jj/mm/aaaa ». */
export function toDisplayDate(isoDate: string): string {
  return calendarDay(isoDate).format('DD/MM/YYYY');
}

/** Saisie au clavier numérique : ne garde que les chiffres et insère les « / ». */
export function formatDateInput(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Jour ISO de la semaine d'une date « AAAA-MM-JJ » : 1 = lundi … 7 = dimanche. */
export function isoWeekday(isoDate: string): number {
  return calendarDay(isoDate).isoWeekday();
}

/** Prochaine date (« AAAA-MM-JJ ») tombant le jour ISO donné, aujourd'hui exclu. */
export function nextWeekday(todayIso: string, weekday: number): string {
  const diff = (weekday - isoWeekday(todayIso) + 7) % 7 || 7;
  return calendarDay(todayIso).add(diff, 'day').format(ISO_DATE);
}

/** « 17:50 » → « 17 h 50 », « 09:05 » → « 9 h 05 ». */
export function formatTime(time: string): string {
  // Heure murale sans fuseau : posée sur un jour quelconque, sans conversion.
  return dayjs(`2000-01-01T${time}`).format('H [h] mm');
}

/** Instant ISO → « 17 novembre », à Paris. */
export function formatDayMonth(instant: string): string {
  return inParis(instant).format('D MMMM');
}

/** « AAAA-MM-JJ » → « mardi 10 novembre ». */
export function formatLongDate(isoDate: string): string {
  return calendarDay(isoDate).format('dddd D MMMM');
}

/** « AAAA-MM-JJ » → « ven. 13 nov. ». */
export function formatShortDate(isoDate: string): string {
  return calendarDay(isoDate).format('ddd D MMM');
}

/** Date-heure locale « AAAA-MM-JJTHH:mm[:ss] » → { date: « AAAA-MM-JJ », time: « HH:mm » }. */
export function splitLocalDateTime(localDateTime: string): {
  date: string;
  time: string;
} {
  // Heure de Paris sans fuseau : lue telle quelle, sans conversion.
  const value = dayjs.utc(localDateTime);
  return { date: value.format(ISO_DATE), time: value.format('HH:mm') };
}

/** Nombre de jours de `fromIso` à `toIso` (« AAAA-MM-JJ »), négatif si `toIso` est avant. */
export function daysBetween(fromIso: string, toIso: string): number {
  return calendarDay(toIso).diff(calendarDay(fromIso), 'day');
}

/** Instant ISO → jour de Paris « AAAA-MM-JJ ». */
export function parisDayOf(instant: string): string {
  return inParis(instant).format(ISO_DATE);
}

/** Instant ISO → « 2 sept. », à Paris. */
export function formatShortDayMonth(instant: string): string {
  return inParis(instant).format('D MMM');
}

/** Instant ISO → « lun. 9 nov., 21 h 04 », à Paris. */
export function formatShortDateTime(instant: string): string {
  return inParis(instant).format('ddd D MMM, H [h] mm');
}

/** Instant ISO → heure à Paris « 18 h 12 ». */
export function formatInstantTime(instant: string): string {
  return inParis(instant).format('H [h] mm');
}

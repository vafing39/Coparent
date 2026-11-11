/** Fuseau de référence de l'app (CLAUDE.md, règle 5). */
export const APP_TIME_ZONE = 'Europe/Paris';

const DISPLAY_DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/** Date du jour à Paris, au format « AAAA-MM-JJ ». */
export function todayInParis(now: Date = new Date()): string {
  // en-CA formate en AAAA-MM-JJ.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** « jj/mm/aaaa » → « AAAA-MM-JJ », ou null si la date n'existe pas (ex. 31/02). */
export function parseDisplayDate(text: string): string | null {
  const match = DISPLAY_DATE.exec(text.trim());
  if (!match) {
    return null;
  }
  const [, dd, mm, yyyy] = match;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return `${yyyy}-${mm}-${dd}`;
}

/** « AAAA-MM-JJ » → « jj/mm/aaaa ». */
export function toDisplayDate(isoDate: string): string {
  const [yyyy, mm, dd] = isoDate.split('-');
  return `${dd}/${mm}/${yyyy}`;
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
  const day = new Date(`${isoDate}T00:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

/** Prochaine date (« AAAA-MM-JJ ») tombant le jour ISO donné, aujourd'hui exclu. */
export function nextWeekday(todayIso: string, weekday: number): string {
  const date = new Date(`${todayIso}T00:00:00Z`);
  const diff = (weekday - isoWeekday(todayIso) + 7) % 7 || 7;
  date.setUTCDate(date.getUTCDate() + diff);
  return date.toISOString().slice(0, 10);
}

/** « 17:50 » → « 17 h 50 », « 09:05 » → « 9 h 05 ». */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  return `${Number(hours)} h ${minutes}`;
}

/** Instant ISO → « 17 novembre », à Paris. */
export function formatDayMonth(instant: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: APP_TIME_ZONE,
    day: 'numeric',
    month: 'long',
  }).format(new Date(instant));
}

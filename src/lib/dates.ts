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

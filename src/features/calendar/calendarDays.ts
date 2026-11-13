import type {
  CalendarEvent,
  Custody,
  FamilyRole,
  Handover,
} from '../../api/types';
import {
  calendarDay,
  inParis,
  ISO_DATE,
  splitLocalDateTime,
} from '../../lib/dates';

// Calcul des jours affichés par le calendrier de garde. Les dates sont des « AAAA-MM-JJ »
// sans fuseau, lues en UTC par `calendarDay` (aucun changement d'heure ne fait glisser un jour).

export type CalendarView = 'month' | 'week';

/** Un jour affiché : le parent de la nuit qui commence ce jour-là, et le passage s'il y en a un. */
export type CalendarDay = {
  date: string;
  /** null si le backend ne renvoie pas cette nuit (hors période chargée). */
  parent: FamilyRole | null;
  /** Passage de garde ce jour-là (`from` jusqu'à l'heure, puis `to`), sinon null. */
  handover: Handover | null;
  /** Nom des vacances scolaires de cette nuit, sinon null. */
  holiday: string | null;
  /** Nuit attribuée par un échange de garde accepté. */
  exchange: boolean;
  /** Événements de ce jour, dans l'ordre reçu du backend (par heure de début). */
  events: CalendarEvent[];
};

/** `isoDate` décalée de `days` jours. */
export function addDays(isoDate: string, days: number): string {
  return calendarDay(isoDate).add(days, 'day').format(ISO_DATE);
}

/** Premier jour du mois de `isoDate`. */
export function monthStart(isoDate: string): string {
  return calendarDay(isoDate).startOf('month').format(ISO_DATE);
}

/** Lundi de la semaine de `isoDate`. */
export function weekStart(isoDate: string): string {
  return calendarDay(isoDate).startOf('isoWeek').format(ISO_DATE);
}

/** Premier jour du mois décalé de `months` mois. */
export function shiftMonth(isoDate: string, months: number): string {
  return calendarDay(isoDate)
    .startOf('month')
    .add(months, 'month')
    .format(ISO_DATE);
}

/** `count` jours consécutifs à partir de `first`. */
function daysFrom(first: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addDays(first, i));
}

/** Les 42 jours (6 semaines, lundi d'abord) de la grille du mois de `isoDate`. */
export function monthGridDates(isoDate: string): string[] {
  return daysFrom(weekStart(monthStart(isoDate)), 42);
}

/** Les 7 jours, du lundi au dimanche, de la semaine de `isoDate`. */
export function weekDates(isoDate: string): string[] {
  return daysFrom(weekStart(isoDate), 7);
}

/** Jours affichés pour une vue : la grille du mois ou la semaine. */
export function periodDates(view: CalendarView, anchor: string): string[] {
  return view === 'month' ? monthGridDates(anchor) : weekDates(anchor);
}

/** Période précédente (-1) ou suivante (+1) : un jour de cette période. */
export function shiftPeriod(
  view: CalendarView,
  anchor: string,
  delta: number,
): string {
  return view === 'month'
    ? shiftMonth(anchor, delta)
    : addDays(weekStart(anchor), 7 * delta);
}

/** « novembre 2026 ». */
export function monthTitle(isoDate: string): string {
  return calendarDay(isoDate).format('MMMM YYYY');
}

/** « 9 – 15 novembre », « 30 novembre – 6 décembre », « 28 décembre 2026 – 3 janvier 2027 ». */
export function weekTitle(isoDate: string): string {
  const first = calendarDay(weekStart(isoDate));
  const last = first.add(6, 'day');
  if (!first.isSame(last, 'year')) {
    return `${first.format('D MMMM YYYY')} – ${last.format('D MMMM YYYY')}`;
  }
  if (!first.isSame(last, 'month')) {
    return `${first.format('D MMMM')} – ${last.format('D MMMM')}`;
  }
  return `${first.format('D')} – ${last.format('D MMMM')}`;
}

/** « lun. ». */
export function weekdayShort(isoDate: string): string {
  return calendarDay(isoDate).format('ddd');
}

/** Les jours `dates`, chacun avec sa nuit et son passage d'après la garde calculée, et ses événements. */
export function buildDays(
  custody: Custody,
  dates: string[],
  events: CalendarEvent[] = [],
): CalendarDay[] {
  const nights = new Map(custody.nights.map(night => [night.date, night]));
  const handovers = new Map(
    custody.handovers.map(h => [splitLocalDateTime(h.at).date, h]),
  );
  return dates.map(date => {
    const night = nights.get(date);
    return {
      date,
      parent: night?.parent ?? null,
      handover: handovers.get(date) ?? null,
      holiday: night?.holiday ?? null,
      exchange: night?.period === 'EXCHANGE',
      events: events.filter(event => event.date === date),
    };
  });
}

/** Maintenant à Paris, au format des passages (« AAAA-MM-JJTHH:mm »). */
export function nowInParis(now: Date = new Date()): string {
  return inParis(now).format('YYYY-MM-DDTHH:mm');
}

/** Les `count` premiers passages après maintenant. */
export function upcomingHandovers(
  handovers: Handover[],
  count: number,
  now: Date = new Date(),
): Handover[] {
  const current = nowInParis(now);
  // Même format des deux côtés : l'ordre du texte est l'ordre chronologique.
  return handovers.filter(h => h.at.slice(0, 16) > current).slice(0, count);
}

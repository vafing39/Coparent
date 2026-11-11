import type {
  CustodyPattern,
  CustodySchedule,
  CustodyScheduleRequest,
  FamilyRole,
  SummerSplit,
} from '../api/types';
import { isoWeekday, nextWeekday } from '../lib/dates';

export const CUSTODY_PATTERNS = [
  'ALTERNATE_WEEKS',
  'TWO_TWO_THREE',
  'TWO_TWO_FIVE_FIVE',
  'ALTERNATE_WEEKENDS_WEDNESDAY',
  'CUSTOM',
] as const satisfies readonly CustodyPattern[];

export const SUMMER_SPLITS = [
  'FORTNIGHTS',
  'MONTHS',
] as const satisfies readonly SummerSplit[];

/** Jours ISO : 1 = lundi … 7 = dimanche. */
export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;
export type Weekday = (typeof WEEKDAYS)[number];

/** Chez qui l'enfant dort, du point de vue de l'utilisateur. */
export type Night = 'me' | 'other';

/** Aperçu et rythme personnalisé : deux semaines, à partir du jour de bascule. */
export const PREVIEW_NIGHTS = 14;

/**
 * Illustration de chaque rythme sur deux semaines (m = parent de départ, o = l'autre),
 * en commençant le jour de bascule. Le calendrier réel est calculé par le backend.
 */
const PATTERN_PREVIEWS: Record<Exclude<CustodyPattern, 'CUSTOM'>, string> = {
  ALTERNATE_WEEKS: 'mmmmmmmooooooo',
  TWO_TWO_THREE: 'mmoommmoommooo',
  TWO_TWO_FIVE_FIVE: 'mmoommmmmooooo',
  ALTERNATE_WEEKENDS_WEDNESDAY: 'mmomooommommmm',
};

/** Étape 4, écran « Rythme ». */
export type ScheduleDraft = {
  pattern: CustodyPattern;
  /** Rythme personnalisé : les 14 nuits à partir du jour de bascule. */
  customNights: Night[];
  handoverWeekday: Weekday;
  /** Heure de Paris, « HH:mm ». */
  handoverTime: string;
  /** Chez qui sont les enfants après la première bascule (hors personnalisé). */
  startsWithMe: boolean;
};

/** Étape 4, écran « Vacances scolaires ». */
export type HolidaysDraft = {
  firstHalfEvenYearsMe: boolean;
  summerSplit: SummerSplit;
};

export const DEFAULT_SCHEDULE: ScheduleDraft = {
  pattern: 'ALTERNATE_WEEKS',
  customNights: nightsFromPreview(PATTERN_PREVIEWS.ALTERNATE_WEEKS, true),
  handoverWeekday: 5,
  handoverTime: '17:50',
  startsWithMe: true,
};

export const DEFAULT_HOLIDAYS: HolidaysDraft = {
  firstHalfEvenYearsMe: true,
  summerSplit: 'FORTNIGHTS',
};

function nightsFromPreview(preview: string, startsWithMe: boolean): Night[] {
  return preview
    .split('')
    .map(c => ((c === 'm') === startsWithMe ? 'me' : 'other'));
}

/** Les 14 nuits affichées dans l'aperçu pour le brouillon. */
export function previewNights(draft: ScheduleDraft): Night[] {
  if (draft.pattern === 'CUSTOM') {
    return draft.customNights;
  }
  return nightsFromPreview(PATTERN_PREVIEWS[draft.pattern], draft.startsWithMe);
}

function otherRole(role: FamilyRole): FamilyRole {
  return role === 'PARENT_A' ? 'PARENT_B' : 'PARENT_A';
}

/** Corps du PUT /custody-schedule. today : date du jour à Paris (« AAAA-MM-JJ »). */
export function toScheduleRequest(
  schedule: ScheduleDraft,
  holidays: HolidaysDraft,
  myRole: FamilyRole,
  today: string,
): CustodyScheduleRequest {
  const roleOf = (night: Night) =>
    night === 'me' ? myRole : otherRole(myRole);
  const custom = schedule.pattern === 'CUSTOM';
  return {
    pattern: schedule.pattern,
    ...(custom && {
      customSequence: schedule.customNights
        .map(night => (roleOf(night) === 'PARENT_A' ? 'A' : 'B'))
        .join(''),
    }),
    startDate: nextWeekday(today, schedule.handoverWeekday),
    handoverTime: schedule.handoverTime,
    startingParent: custom
      ? roleOf(schedule.customNights[0])
      : roleOf(schedule.startsWithMe ? 'me' : 'other'),
    holidayFirstHalfEvenYears: roleOf(
      holidays.firstHalfEvenYearsMe ? 'me' : 'other',
    ),
    summerSplit: holidays.summerSplit,
  };
}

/** Brouillons préremplis depuis le rythme déjà proposé. */
export function fromSchedule(
  schedule: CustodySchedule,
  myRole: FamilyRole,
): { schedule: ScheduleDraft; holidays: HolidaysDraft } {
  const nightOf = (role: FamilyRole): Night =>
    role === myRole ? 'me' : 'other';
  const sequence = schedule.customSequence ?? '';
  const customNights =
    sequence.length > 0
      ? Array.from({ length: PREVIEW_NIGHTS }, (_, i) =>
          nightOf(
            sequence[i % sequence.length] === 'A' ? 'PARENT_A' : 'PARENT_B',
          ),
        )
      : DEFAULT_SCHEDULE.customNights;
  return {
    schedule: {
      pattern: schedule.pattern,
      customNights,
      handoverWeekday: isoWeekday(schedule.startDate) as Weekday,
      handoverTime: schedule.handoverTime.slice(0, 5),
      startsWithMe: schedule.startingParent === myRole,
    },
    holidays: {
      firstHalfEvenYearsMe: schedule.holidayFirstHalfEvenYears
        ? schedule.holidayFirstHalfEvenYears === myRole
        : DEFAULT_HOLIDAYS.firstHalfEvenYearsMe,
      summerSplit: schedule.summerSplit ?? DEFAULT_HOLIDAYS.summerSplit,
    },
  };
}

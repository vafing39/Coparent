import type { CustodySchedule } from '../../api/types';
import {
  DEFAULT_HOLIDAYS,
  DEFAULT_SCHEDULE,
  fromSchedule,
  previewNights,
  toScheduleRequest,
} from '../custody';

// Mercredi 11 novembre 2026.
const TODAY = '2026-11-11';

test('par défaut : une semaine sur deux, prochain vendredi 17:50, chez moi', () => {
  expect(
    toScheduleRequest(DEFAULT_SCHEDULE, DEFAULT_HOLIDAYS, 'PARENT_A', TODAY),
  ).toEqual({
    pattern: 'ALTERNATE_WEEKS',
    startDate: '2026-11-13',
    handoverTime: '17:50',
    startingParent: 'PARENT_A',
    holidayFirstHalfEvenYears: 'PARENT_A',
    summerSplit: 'FORTNIGHTS',
  });
});

test('« chez l’autre parent » et années impaires : rôles inversés', () => {
  const body = toScheduleRequest(
    { ...DEFAULT_SCHEDULE, startsWithMe: false, handoverWeekday: 1 },
    { firstHalfEvenYearsMe: false, summerSplit: 'MONTHS' },
    'PARENT_A',
    TODAY,
  );
  expect(body.startingParent).toBe('PARENT_B');
  expect(body.holidayFirstHalfEvenYears).toBe('PARENT_B');
  expect(body.summerSplit).toBe('MONTHS');
  expect(body.startDate).toBe('2026-11-16');
  expect(body.customSequence).toBeUndefined();
});

test('personnalisé : une lettre par nuit selon mon rôle, départ = 1re nuit', () => {
  const customNights = [...Array(3).fill('other'), ...Array(11).fill('me')] as (
    | 'me'
    | 'other'
  )[];
  const asA = toScheduleRequest(
    { ...DEFAULT_SCHEDULE, pattern: 'CUSTOM', customNights },
    DEFAULT_HOLIDAYS,
    'PARENT_A',
    TODAY,
  );
  expect(asA.customSequence).toBe('BBBAAAAAAAAAAA');
  expect(asA.startingParent).toBe('PARENT_B');

  const asB = toScheduleRequest(
    { ...DEFAULT_SCHEDULE, pattern: 'CUSTOM', customNights },
    DEFAULT_HOLIDAYS,
    'PARENT_B',
    TODAY,
  );
  expect(asB.customSequence).toBe('AAABBBBBBBBBBB');
});

test('aperçu : suit le parent de départ', () => {
  expect(previewNights(DEFAULT_SCHEDULE).slice(0, 8)).toEqual([
    ...Array(7).fill('me'),
    'other',
  ]);
  expect(previewNights({ ...DEFAULT_SCHEDULE, startsWithMe: false })[0]).toBe(
    'other',
  );
});

test('fromSchedule : rythme déjà proposé → brouillons', () => {
  const schedule: CustodySchedule = {
    id: 's1',
    pattern: 'CUSTOM',
    customSequence: 'AABB',
    startDate: '2026-11-16',
    handoverTime: '18:30:00',
    startingParent: 'PARENT_A',
    holidayFirstHalfEvenYears: 'PARENT_B',
    summerSplit: 'MONTHS',
    status: 'PROPOSED',
  };
  const { schedule: draft, holidays } = fromSchedule(schedule, 'PARENT_A');
  expect(draft.handoverWeekday).toBe(1);
  expect(draft.handoverTime).toBe('18:30');
  expect(draft.customNights.slice(0, 5)).toEqual([
    'me',
    'me',
    'other',
    'other',
    'me',
  ]);
  expect(draft.customNights).toHaveLength(14);
  expect(holidays).toEqual({
    firstHalfEvenYearsMe: false,
    summerSplit: 'MONTHS',
  });
});

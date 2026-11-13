import type { Custody } from '../../../api/types';
import {
  buildDays,
  monthGridDates,
  monthTitle,
  nowInParis,
  shiftPeriod,
  upcomingHandovers,
  weekDates,
  weekTitle,
  weekdayShort,
} from '../calendarDays';

test('grille de novembre 2026 : 42 jours, du lundi 26 octobre au dimanche 6 décembre', () => {
  const days = monthGridDates('2026-11-10');
  expect(days).toHaveLength(42);
  expect(days[0]).toBe('2026-10-26');
  expect(days[41]).toBe('2026-12-06');
  expect(weekdayShort(days[0])).toBe('lun.');
  expect(monthTitle('2026-11-10')).toBe('novembre 2026');
});

test('semaine du 10 novembre : du 9 au 15', () => {
  expect(weekDates('2026-11-10')).toEqual([
    '2026-11-09',
    '2026-11-10',
    '2026-11-11',
    '2026-11-12',
    '2026-11-13',
    '2026-11-14',
    '2026-11-15',
  ]);
  expect(weekTitle('2026-11-10')).toBe('9 – 15 novembre');
});

test('semaines des changements d’heure : 7 jours', () => {
  expect(weekDates('2026-03-29')).toHaveLength(7);
  expect(new Set(weekDates('2026-03-29')).size).toBe(7);
  expect(weekDates('2026-10-25')[6]).toBe('2026-10-25');
});

test('titres de semaine à cheval sur deux mois ou deux années', () => {
  expect(weekTitle('2026-12-01')).toBe('30 novembre – 6 décembre');
  expect(weekTitle('2026-12-31')).toBe('28 décembre 2026 – 3 janvier 2027');
});

test('période précédente et suivante, passage d’année', () => {
  expect(shiftPeriod('month', '2026-12-15', 1)).toBe('2027-01-01');
  expect(shiftPeriod('month', '2027-01-01', -1)).toBe('2026-12-01');
  expect(shiftPeriod('week', '2026-12-31', 1)).toBe('2027-01-04');
  expect(shiftPeriod('week', '2026-11-10', -1)).toBe('2026-11-02');
});

const CUSTODY: Custody = {
  scheduleStatus: 'ACTIVE',
  nights: [
    {
      date: '2026-11-12',
      parent: 'PARENT_B',
      period: 'REGULAR',
      holiday: null,
    },
    {
      date: '2026-11-13',
      parent: 'PARENT_A',
      period: 'REGULAR',
      holiday: null,
    },
    {
      date: '2026-12-19',
      parent: 'PARENT_A',
      period: 'SHORT_HOLIDAY',
      holiday: 'Vacances de Noël',
    },
  ],
  handovers: [
    { at: '2026-11-13T17:50:00', from: 'PARENT_B', to: 'PARENT_A' },
    { at: '2026-11-20T17:50:00', from: 'PARENT_A', to: 'PARENT_B' },
  ],
  nextHandover: null,
};

test('chaque jour : parent de la nuit, passage, vacances et échange', () => {
  expect(
    buildDays(CUSTODY, [
      '2026-11-12',
      '2026-11-13',
      '2026-12-19',
      '2027-01-01',
    ]),
  ).toEqual([
    {
      date: '2026-11-12',
      parent: 'PARENT_B',
      handover: null,
      holiday: null,
      exchange: false,
      events: [],
    },
    {
      date: '2026-11-13',
      parent: 'PARENT_A',
      handover: CUSTODY.handovers[0],
      holiday: null,
      exchange: false,
      events: [],
    },
    {
      date: '2026-12-19',
      parent: 'PARENT_A',
      handover: null,
      holiday: 'Vacances de Noël',
      exchange: false,
      events: [],
    },
    {
      date: '2027-01-01',
      parent: null,
      handover: null,
      holiday: null,
      exchange: false,
      events: [],
    },
  ]);
});

test('nuit attribuée par un échange accepté', () => {
  const custody = {
    ...CUSTODY,
    nights: [
      {
        date: '2026-11-20',
        parent: 'PARENT_A' as const,
        period: 'EXCHANGE' as const,
        holiday: null,
      },
    ],
  };
  expect(buildDays(custody, ['2026-11-20'])[0]).toMatchObject({
    parent: 'PARENT_A',
    exchange: true,
  });
});

test('prochains passages : seulement après maintenant (heure de Paris)', () => {
  // 13 novembre, 17 h 49 à Paris
  const before = new Date('2026-11-13T16:49:00Z');
  expect(nowInParis(before)).toBe('2026-11-13T17:49');
  expect(upcomingHandovers(CUSTODY.handovers, 3, before)).toHaveLength(2);
  // 17 h 50 : le passage du jour est en cours, il ne compte plus
  const at = new Date('2026-11-13T16:50:00Z');
  expect(upcomingHandovers(CUSTODY.handovers, 3, at)).toEqual([
    CUSTODY.handovers[1],
  ]);
});

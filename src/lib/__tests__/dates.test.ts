import {
  daysBetween,
  formatDateInput,
  formatLongDate,
  formatShortDate,
  hourInParis,
  splitLocalDateTime,
  formatTime,
  isoWeekday,
  nextWeekday,
  parseDisplayDate,
  toDisplayDate,
  todayInParis,
} from '../dates';

test('formatDateInput insère les « / » et ignore le reste', () => {
  expect(formatDateInput('03')).toBe('03');
  expect(formatDateInput('0303')).toBe('03/03');
  expect(formatDateInput('03032018')).toBe('03/03/2018');
  expect(formatDateInput('03/03/2018 99')).toBe('03/03/2018');
});

test('parseDisplayDate refuse les dates qui n’existent pas', () => {
  expect(parseDisplayDate('03/03/2018')).toBe('2018-03-03');
  expect(parseDisplayDate('29/02/2020')).toBe('2020-02-29');
  expect(parseDisplayDate('29/02/2021')).toBeNull();
  expect(parseDisplayDate('31/04/2020')).toBeNull();
  expect(parseDisplayDate('3/3/2018')).toBeNull();
});

test('toDisplayDate', () => {
  expect(toDisplayDate('2021-08-21')).toBe('21/08/2021');
});

test('todayInParis suit le fuseau de Paris', () => {
  // 23 h 30 UTC le 31 décembre = déjà le 1er janvier à Paris.
  expect(todayInParis(new Date('2025-12-31T23:30:00Z'))).toBe('2026-01-01');
});

test('isoWeekday : lundi = 1, dimanche = 7', () => {
  expect(isoWeekday('2026-11-09')).toBe(1);
  expect(isoWeekday('2026-11-15')).toBe(7);
});

test('nextWeekday : prochaine occurrence, aujourd’hui exclu', () => {
  // Mercredi 11 novembre 2026.
  expect(nextWeekday('2026-11-11', 5)).toBe('2026-11-13');
  expect(nextWeekday('2026-11-11', 3)).toBe('2026-11-18');
  expect(nextWeekday('2026-11-11', 1)).toBe('2026-11-16');
  expect(nextWeekday('2026-12-30', 5)).toBe('2027-01-01');
});

test('formatTime', () => {
  expect(formatTime('17:50')).toBe('17 h 50');
  expect(formatTime('09:05')).toBe('9 h 05');
});

test('formatLongDate et formatShortDate', () => {
  expect(formatLongDate('2026-11-10')).toBe('mardi 10 novembre');
  expect(formatShortDate('2026-11-13')).toBe('ven. 13 nov.');
});

test('splitLocalDateTime lit la date-heure de Paris sans fuseau', () => {
  expect(splitLocalDateTime('2026-11-13T17:50:00')).toEqual({
    date: '2026-11-13',
    time: '17:50',
  });
});

test('daysBetween traverse le changement d’heure', () => {
  expect(daysBetween('2026-11-10', '2026-11-13')).toBe(3);
  expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
  expect(daysBetween('2026-11-13', '2026-11-10')).toBe(-3);
});

test('hourInParis suit le fuseau de Paris', () => {
  expect(hourInParis(new Date('2026-11-10T17:30:00Z'))).toBe(18);
  expect(hourInParis(new Date('2026-07-10T16:30:00Z'))).toBe(18);
  expect(hourInParis(new Date('2026-11-10T23:30:00Z'))).toBe(0);
});

import {
  formatDateInput,
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

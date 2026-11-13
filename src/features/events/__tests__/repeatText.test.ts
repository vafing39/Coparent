import { customLabel, weekdayRank } from '../repeatText';

test('résumé d’une règle personnalisée', () => {
  // Jeudi 19 novembre 2026
  const date = '2026-11-19';
  expect(
    customLabel({ interval: 3, unit: 'DAY', monthMode: null, days: [] }, date),
  ).toBe('Tous les 3 jours');
  expect(
    customLabel(
      {
        interval: 1,
        unit: 'WEEK',
        monthMode: null,
        days: [
          { dayOfWeek: 'THURSDAY', startTime: null, endTime: null },
          { dayOfWeek: 'MONDAY', startTime: null, endTime: null },
        ],
      },
      date,
    ),
  ).toBe('Chaque semaine, le lundi et le jeudi');
  expect(
    customLabel(
      { interval: 2, unit: 'MONTH', monthMode: 'DAY_OF_MONTH', days: [] },
      date,
    ),
  ).toBe('Tous les 2 mois, le 19');
  expect(
    customLabel(
      { interval: 1, unit: 'MONTH', monthMode: 'WEEKDAY_OF_MONTH', days: [] },
      date,
    ),
  ).toBe('Chaque mois, le troisième jeudi');
});

test('rang du jour dans le mois : un cinquième devient « le dernier »', () => {
  expect(weekdayRank('2026-11-01')).toBe(1);
  expect(weekdayRank('2026-11-19')).toBe(3);
  expect(weekdayRank('2026-10-30')).toBe(5);
});

import {
  amountInput,
  formatEuros,
  owedCents,
  parseAmount,
  splitLabel,
} from '../expenses';

test('formatEuros : virgule, espaces insécables, signe moins', () => {
  expect(formatEuros(4250)).toBe('42,50 €');
  expect(formatEuros(5)).toBe('0,05 €');
  expect(formatEuros(125000)).toBe('1 250,00 €');
  expect(formatEuros(-4250)).toBe('−42,50 €');
});

test('parseAmount : virgule ou point, deux décimales au plus', () => {
  expect(parseAmount('64,20')).toBe(6420);
  expect(parseAmount('64.2')).toBe(6420);
  expect(parseAmount(' 64 € ')).toBe(6400);
  expect(parseAmount('0,05')).toBe(5);
  expect(parseAmount('64,205')).toBeNull();
  expect(parseAmount('abc')).toBeNull();
  expect(parseAmount('')).toBeNull();
  expect(amountInput(6420)).toBe('64,20');
  expect(amountInput(5)).toBe('0,05');
});

test('owedCents : arrondi au centime, comme le serveur', () => {
  expect(owedCents(8500, 50)).toBe(4250);
  expect(owedCents(1005, 70)).toBe(302);
  expect(owedCents(1000, 100)).toBe(0);
  expect(owedCents(1000, 0)).toBe(1000);
});

test('splitLabel : 50/50, parts nommées, ou à la charge d’un parent', () => {
  expect(splitLabel(50, 'Camille', 'Julien')).toBe('50/50');
  expect(splitLabel(70, 'Camille', 'Julien')).toBe(
    'Camille 70 % · Julien 30 %',
  );
  expect(splitLabel(100, 'Camille', 'Julien')).toBe('À la charge de Camille');
  expect(splitLabel(0, 'Camille', 'Julien')).toBe('À la charge de Julien');
});

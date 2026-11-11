import { childSchema } from '../children';

function parse(birthDate: string, firstName = 'Léa') {
  return childSchema.safeParse({ firstName, birthDate });
}

test('date valide : envoyée au format AAAA-MM-JJ, prénom nettoyé', () => {
  const result = parse('03/03/2018', '  Léa ');
  expect(result.success && result.data).toEqual({
    firstName: 'Léa',
    birthDate: '2018-03-03',
  });
});

test.each([
  ['', 'Saisissez la date de naissance.'],
  ['03/03', 'Date invalide. Saisissez-la sous la forme jj/mm/aaaa.'],
  ['31/02/2020', 'Date invalide. Saisissez-la sous la forme jj/mm/aaaa.'],
  ['01/01/1850', 'Date invalide. Saisissez-la sous la forme jj/mm/aaaa.'],
  ['01/01/2999', 'La date de naissance ne peut pas être dans le futur.'],
])('date « %s » refusée', (birthDate, message) => {
  const result = parse(birthDate);
  expect(result.success).toBe(false);
  expect(result.error?.issues.map(issue => issue.message)).toEqual([message]);
});

test('prénom vide refusé', () => {
  const result = parse('03/03/2018', '   ');
  expect(result.error?.issues[0].message).toBe(
    "Saisissez le prénom de l'enfant.",
  );
});

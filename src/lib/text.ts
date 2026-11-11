import i18n from '../i18n';

/** « Léa », « Léa et Hugo », « Léa, Hugo et Tom ». */
export function joinNames(names: string[]): string {
  if (names.length <= 1) {
    return names[0] ?? '';
  }
  const and = i18n.t('common.and');
  return `${names.slice(0, -1).join(', ')} ${and} ${names[names.length - 1]}`;
}

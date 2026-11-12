import i18n from '../../i18n';
import type { Family, FamilyRole } from '../../api/types';

/** L'autre parent n'a pas encore rejoint la famille : pas de prénom ni d'initiale. */
const UNKNOWN_INITIAL = '?';

/** Prénom et initiale d'un parent de la famille, ou « l'autre parent » et « ? » s'il manque. */
export function parentOf(
  family: Family,
  role: FamilyRole,
): { name: string; initial: string } {
  const member = family.members.find(m => m.role === role);
  if (!member) {
    return { name: i18n.t('home.otherParent'), initial: UNKNOWN_INITIAL };
  }
  return {
    name: member.firstName,
    initial: member.firstName.charAt(0).toUpperCase(),
  };
}

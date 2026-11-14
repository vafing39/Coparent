import i18n from '../../i18n';
import { nameOf } from '../../api/expenses';
import type {
  DocumentHistoryLine,
  Family,
  FamilyDocument,
  FamilyRole,
} from '../../api/types';
import { formatShortDateTime, formatShortDayMonth } from '../../lib/dates';

/** Prénom d'un parent : celui enregistré, sinon celui de son rôle dans la famille. */
function personName(
  family: Family,
  role: FamilyRole,
  firstName: string | null,
): string {
  return firstName ?? nameOf(family, role);
}

/** « Jugement · Léa · ajouté par Camille, 2 sept. » (sans enfant : tous les enfants). */
export function documentMeta(family: Family, document: FamilyDocument): string {
  const values = {
    category: i18n.t(`documents.categories.${document.category}`),
    child: document.childFirstName ?? '',
    name: personName(family, document.authorRole, document.authorFirstName),
    date: formatShortDayMonth(document.createdAt),
  };
  return document.childFirstName
    ? i18n.t('documents.row.metaChild', values)
    : i18n.t('documents.row.meta', values);
}

/** « Supprimé par Camille, 12 nov. », ou null pour un document en ligne. */
export function documentDeleted(
  family: Family,
  document: FamilyDocument,
): string | null {
  if (!document.deletedAt || !document.deletedByRole) {
    return null;
  }
  return i18n.t('documents.row.deleted', {
    name: nameOf(family, document.deletedByRole),
    date: formatShortDayMonth(document.deletedAt),
  });
}

/** « Julien · lun. 9 nov., 21 h 04 », ou « Supprimé par Camille · … ». */
export function historyText(family: Family, line: DocumentHistoryLine): string {
  const values = {
    name: personName(family, line.role, line.firstName),
    date: formatShortDateTime(line.at),
  };
  return line.kind === 'DELETED'
    ? i18n.t('documents.row.deletedLine', values)
    : i18n.t('documents.row.viewLine', values);
}

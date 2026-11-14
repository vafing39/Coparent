import i18n from '../../i18n';
import type { PendingInvitation } from '../../api/types';
import { formatDayMonth } from '../../lib/dates';

/** « Invitation envoyée à Julien le 10 novembre, valable jusqu'au 17 novembre. » ou « … a expiré. » */
export function invitationStatus(invitation: PendingInvitation): string {
  const values = {
    name: invitation.inviteeFirstName,
    sentAt: formatDayMonth(invitation.sentAt),
    expiresAt: formatDayMonth(invitation.expiresAt),
  };
  return invitation.expired
    ? i18n.t('invite.expired', values)
    : i18n.t('invite.sent', values);
}

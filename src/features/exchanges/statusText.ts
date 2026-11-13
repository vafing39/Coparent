import i18n from '../../i18n';
import type { Exchange } from '../../api/types';

/**
 * Où en est la demande, du point de vue de qui la lit : « Julien attend votre réponse. »,
 * « En attente de la réponse de Julien. », « Échange accepté : … ».
 */
export function statusText(
  exchange: Exchange,
  requester: string,
  other: string,
): string {
  switch (exchange.status) {
    case 'PENDING':
      return exchange.mine
        ? i18n.t('exchanges.status.waitingOther', { name: other })
        : i18n.t('exchanges.status.waitingMe', { name: requester });
    case 'ACCEPTED':
      return i18n.t('exchanges.status.accepted');
    case 'DECLINED':
      return i18n.t('exchanges.status.declined');
    case 'CANCELLED':
      return i18n.t('exchanges.status.cancelled');
  }
}

import type { ImageURISource } from 'react-native';
import { receiptPath } from '../../api/expenses';
import type { Expense } from '../../api/types';
import { useFamily } from '../../hooks/useFamily';
import { API_URL } from '../../lib/config';
import { useSession } from '../../stores/session';

/**
 * Source de l'image du justificatif d'une dépense, chargée avec le jeton de session ; null sans
 * justificatif. `?v=` change à chaque nouveau justificatif : l'image en cache n'est jamais périmée.
 */
export function useReceiptSource(
  expense: Expense | undefined,
): ImageURISource | null {
  const { family } = useFamily();
  const accessToken = useSession(state => state.accessToken);
  if (!family || !expense?.receiptUpdatedAt) {
    return null;
  }
  return {
    uri: `${API_URL}${receiptPath(
      family.id,
      expense.id,
    )}?v=${encodeURIComponent(expense.receiptUpdatedAt)}`,
    headers: accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : undefined,
  };
}

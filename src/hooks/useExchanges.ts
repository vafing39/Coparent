import { useContext } from 'react';
import {
  ExchangesContext,
  ExchangesContextValue,
} from '../context/ExchangesContext';

/** Demandes d'échange de garde (ExchangesProvider). */
export function useExchanges(): ExchangesContextValue {
  const value = useContext(ExchangesContext);
  if (!value) {
    throw new Error(
      'useExchanges doit être utilisé dans un ExchangesProvider.',
    );
  }
  return value;
}

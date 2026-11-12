import { useContext } from 'react';
import { CustodyContext, CustodyContextValue } from '../context/CustodyContext';

/** La garde du jour chargée par CustodyProvider : ce soir et le prochain passage. */
export function useCustody(): CustodyContextValue {
  const value = useContext(CustodyContext);
  if (!value) {
    throw new Error('useCustody doit être utilisé dans un CustodyProvider.');
  }
  return value;
}

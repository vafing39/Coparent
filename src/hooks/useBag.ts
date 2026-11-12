import { useContext } from 'react';
import { BagContext, BagContextValue } from '../context/BagContext';

/** Le sac du prochain passage chargé par BagProvider, et ses actions. */
export function useBag(): BagContextValue {
  const value = useContext(BagContext);
  if (!value) {
    throw new Error('useBag doit être utilisé dans un BagProvider.');
  }
  return value;
}

import { useContext } from 'react';
import { FamilyContext, FamilyContextValue } from '../context/FamilyContext';

/** La famille chargée par FamilyProvider (null : pas encore créée) et ses enregistrements. */
export function useFamily(): FamilyContextValue {
  const value = useContext(FamilyContext);
  if (!value) {
    throw new Error('useFamily doit être utilisé dans un FamilyProvider.');
  }
  return value;
}

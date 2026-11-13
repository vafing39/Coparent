import { useContext } from 'react';
import { AccountContext, AccountContextValue } from '../context/AccountContext';

/** Actions de « Mon compte » (mot de passe, données, suppression). */
export function useAccount(): AccountContextValue {
  const value = useContext(AccountContext);
  if (!value) {
    throw new Error('useAccount doit être utilisé dans un AccountProvider.');
  }
  return value;
}

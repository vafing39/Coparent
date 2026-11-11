import { useContext } from 'react';
import { AuthContext, AuthContextValue } from '../context/AuthContext';

/** Session de l'utilisateur : statut, utilisateur, connexion et déconnexion. */
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider.');
  }
  return value;
}

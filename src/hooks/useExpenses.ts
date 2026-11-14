import { useContext } from 'react';
import {
  ExpensesContext,
  ExpensesContextValue,
} from '../context/ExpensesContext';

/** Dépenses partagées, solde et virements (ExpensesProvider). */
export function useExpenses(): ExpensesContextValue {
  const value = useContext(ExpensesContext);
  if (!value) {
    throw new Error('useExpenses doit être utilisé dans un ExpensesProvider.');
  }
  return value;
}

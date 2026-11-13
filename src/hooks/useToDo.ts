import { useContext } from 'react';
import { ToDoContext, ToDoContextValue } from '../context/ToDoContext';

/** « À traiter » chargé par ToDoProvider. */
export function useToDo(): ToDoContextValue {
  const value = useContext(ToDoContext);
  if (!value) {
    throw new Error('useToDo doit être utilisé dans un ToDoProvider.');
  }
  return value;
}

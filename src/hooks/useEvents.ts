import { useContext } from 'react';
import { EventsContext, EventsContextValue } from '../context/EventsContext';

/** Création, modification et suppression des événements (EventsProvider). */
export function useEvents(): EventsContextValue {
  const value = useContext(EventsContext);
  if (!value) {
    throw new Error('useEvents doit être utilisé dans un EventsProvider.');
  }
  return value;
}

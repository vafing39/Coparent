import { useContext } from 'react';
import {
  CalendarContext,
  CalendarContextValue,
} from '../context/CalendarContext';

/** Calendrier de garde détenu par CalendarProvider : vue, période et garde calculée. */
export function useCalendar(): CalendarContextValue {
  const value = useContext(CalendarContext);
  if (!value) {
    throw new Error('useCalendar doit être utilisé dans un CalendarProvider.');
  }
  return value;
}

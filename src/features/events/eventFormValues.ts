import type {
  CalendarEvent,
  EventBody,
  EventReminder,
  EventType,
  EventVisibility,
  Family,
} from '../../api/types';
import { todayInParis } from '../../lib/dates';
import type { EventInput, EventValues } from '../../schemas/event';

// Valeurs du formulaire d'un événement (EventFormScreen) : choix proposés, valeurs de départ,
// corps envoyé au serveur.

export const TYPES: EventType[] = [
  'APPOINTMENT',
  'ACTIVITY',
  'SCHOOL',
  'OTHER',
];
export const REMINDERS: EventReminder[] = [
  'NONE',
  'ONE_HOUR',
  'DAY_BEFORE',
  'TWO_DAYS',
];
export const VISIBILITIES: EventVisibility[] = ['SHARED', 'PRIVATE'];

/** Valeurs de départ : l'événement à modifier, ou un nouvel événement le jour donné. */
export function defaults(
  family: Family | null,
  event: CalendarEvent | undefined,
  date: string | undefined,
): EventInput {
  if (event) {
    return {
      title: event.title,
      type: event.type,
      childIds: event.children.map(child => child.id),
      allDay: event.allDay,
      date: event.date,
      startTime: event.startTime?.slice(0, 5) ?? '09:00',
      endTime: event.endTime?.slice(0, 5) ?? '10:00',
      location: event.location ?? '',
      reminder: event.reminder,
      visibility: event.visibility,
      repeat: event.repeat
        ? {
            frequency: event.repeat.frequency,
            onlyWith: event.repeat.onlyWith,
            skipHolidays: event.repeat.skipHolidays,
            end: event.repeat.end,
            count: event.repeat.count,
          }
        : null,
    };
  }
  const children = family?.children ?? [];
  return {
    title: '',
    type: 'APPOINTMENT',
    childIds: children.length === 1 ? [children[0].id] : [],
    allDay: false,
    date: date ?? todayInParis(),
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    reminder: 'NONE',
    visibility: 'SHARED',
    repeat: null,
  };
}

/** Valeurs du formulaire → corps de la requête (heures nulles pour une journée entière). */
export function toBody(values: EventValues): EventBody {
  return {
    title: values.title,
    type: values.type,
    childIds: values.childIds,
    date: values.date,
    allDay: values.allDay,
    startTime: values.allDay ? null : values.startTime,
    endTime: values.allDay ? null : values.endTime,
    location: values.location === '' ? null : values.location,
    reminder: values.reminder,
    visibility: values.visibility,
    repeat: values.repeat,
  };
}

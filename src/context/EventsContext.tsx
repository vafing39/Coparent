import React, { createContext, useMemo } from 'react';
import {
  UseMutateFunction,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { eventKeys } from '../api/events';
import type { CalendarEvent, EventBody } from '../api/types';
import { useFamily } from '../hooks/useFamily';

// Requêtes HTTP des événements (création, modification, suppression), appelées uniquement
// par EventsProvider. Les listes sont chargées par CalendarProvider.

function eventsPath(familyId: string) {
  return `/api/v1/families/${familyId}/events`;
}

async function createEventRequest(
  familyId: string,
  body: EventBody,
): Promise<CalendarEvent> {
  const { data } = await apiClient.post<CalendarEvent>(
    eventsPath(familyId),
    body,
  );
  return data;
}

async function updateEventRequest(
  familyId: string,
  { id, body }: UpdateEventVariables,
): Promise<CalendarEvent> {
  const { data } = await apiClient.put<CalendarEvent>(
    `${eventsPath(familyId)}/${id}`,
    body,
  );
  return data;
}

async function deleteEventRequest(familyId: string, id: string): Promise<void> {
  await apiClient.delete(`${eventsPath(familyId)}/${id}`);
}

export type UpdateEventVariables = { id: string; body: EventBody };

/** Chaque action : la lancer, savoir si elle est en cours, son erreur, la remettre à zéro. */
export type EventsContextValue = {
  createEvent: UseMutateFunction<CalendarEvent, Error, EventBody>;
  isCreatingEvent: boolean;
  createEventError: Error | null;
  resetCreateEvent: () => void;
  updateEvent: UseMutateFunction<CalendarEvent, Error, UpdateEventVariables>;
  isUpdatingEvent: boolean;
  updateEventError: Error | null;
  resetUpdateEvent: () => void;
  deleteEvent: UseMutateFunction<void, Error, string>;
  isDeletingEvent: boolean;
  deleteEventError: Error | null;
  resetDeleteEvent: () => void;
};

export const EventsContext = createContext<EventsContextValue | null>(null);

/**
 * Détient la création, la modification et la suppression des événements. Après chacune, les
 * listes d'événements de la famille sont rechargées (calendrier, « Aujourd'hui »).
 */
export function EventsProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { family } = useFamily();
  const familyId = family?.id ?? '';
  const onSaved = () =>
    queryClient.invalidateQueries({ queryKey: eventKeys.all(familyId) });

  const {
    mutate: createEvent,
    isPending: isCreatingEvent,
    error: createEventError,
    reset: resetCreateEvent,
  } = useMutation({
    mutationFn: (body: EventBody) => createEventRequest(familyId, body),
    onSuccess: onSaved,
  });
  const {
    mutate: updateEvent,
    isPending: isUpdatingEvent,
    error: updateEventError,
    reset: resetUpdateEvent,
  } = useMutation({
    mutationFn: (variables: UpdateEventVariables) =>
      updateEventRequest(familyId, variables),
    onSuccess: onSaved,
  });
  const {
    mutate: deleteEvent,
    isPending: isDeletingEvent,
    error: deleteEventError,
    reset: resetDeleteEvent,
  } = useMutation({
    mutationFn: (id: string) => deleteEventRequest(familyId, id),
    onSuccess: onSaved,
  });

  const value = useMemo<EventsContextValue>(
    () => ({
      createEvent,
      isCreatingEvent,
      createEventError,
      resetCreateEvent,
      updateEvent,
      isUpdatingEvent,
      updateEventError,
      resetUpdateEvent,
      deleteEvent,
      isDeletingEvent,
      deleteEventError,
      resetDeleteEvent,
    }),
    [
      createEvent,
      isCreatingEvent,
      createEventError,
      resetCreateEvent,
      updateEvent,
      isUpdatingEvent,
      updateEventError,
      resetUpdateEvent,
      deleteEvent,
      isDeletingEvent,
      deleteEventError,
      resetDeleteEvent,
    ],
  );
  return (
    <EventsContext.Provider value={value}>{children}</EventsContext.Provider>
  );
}

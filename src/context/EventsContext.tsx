import React, { createContext, useMemo, useState } from 'react';
import {
  UseMutateFunction,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { eventKeys } from '../api/events';
import type {
  CalendarEvent,
  EventBody,
  EventRepeat,
  EventScope,
  RepeatPreviewDate,
} from '../api/types';
import { useFamily } from '../hooks/useFamily';

// Requêtes HTTP des événements (création, modification, suppression, aperçu d'une répétition),
// appelées uniquement par EventsProvider. Les listes sont chargées par CalendarProvider.

function eventsPath(familyId: string) {
  return `/api/v1/families/${familyId}/events`;
}

/** Séances concernées dans une série (rien pour un événement unique). */
function scopeQuery(scope?: EventScope, date?: string): string {
  if (!scope) {
    return '';
  }
  return date ? `?scope=${scope}&date=${date}` : `?scope=${scope}`;
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
  { id, body, scope, date }: UpdateEventVariables,
): Promise<CalendarEvent> {
  const { data } = await apiClient.put<CalendarEvent>(
    `${eventsPath(familyId)}/${id}${scopeQuery(scope, date)}`,
    body,
  );
  return data;
}

async function deleteEventRequest(
  familyId: string,
  { id, scope, date }: DeleteEventVariables,
): Promise<void> {
  await apiClient.delete(
    `${eventsPath(familyId)}/${id}${scopeQuery(scope, date)}`,
  );
}

async function fetchRepeatPreview(
  familyId: string,
  request: RepeatPreviewRequest,
): Promise<RepeatPreviewDate[]> {
  const { data } = await apiClient.post<RepeatPreviewDate[]>(
    `${eventsPath(familyId)}/repeat-preview`,
    request,
  );
  return data;
}

/** Pour une séance d'une série : `scope` et `date` (la séance ouverte) disent lesquelles changent. */
export type UpdateEventVariables = {
  id: string;
  body: EventBody;
  scope?: EventScope;
  date?: string;
};
export type DeleteEventVariables = {
  id: string;
  scope?: EventScope;
  date?: string;
};
/** Première séance et règle d'une répétition en cours de choix. */
export type RepeatPreviewRequest = { date: string; repeat: EventRepeat };

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
  deleteEvent: UseMutateFunction<void, Error, DeleteEventVariables>;
  isDeletingEvent: boolean;
  deleteEventError: Error | null;
  resetDeleteEvent: () => void;
  /** L'écran « Répéter » donne la règle choisie (null : rien à prévoir), puis lit l'aperçu. */
  previewRepeat: (request: RepeatPreviewRequest | null) => void;
  repeatPreview: RepeatPreviewDate[] | undefined;
  isLoadingRepeatPreview: boolean;
  repeatPreviewError: Error | null;
};

export const EventsContext = createContext<EventsContextValue | null>(null);

/**
 * Détient la création, la modification et la suppression des événements, et l'aperçu d'une
 * répétition (calculé par le serveur : garde et vacances). Après chaque enregistrement, les
 * listes d'événements de la famille sont rechargées (calendrier, « Aujourd'hui »).
 */
export function EventsProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { family } = useFamily();
  const familyId = family?.id ?? '';
  const onSaved = () =>
    queryClient.invalidateQueries({ queryKey: eventKeys.all(familyId) });

  const [previewRequest, setPreviewRequest] =
    useState<RepeatPreviewRequest | null>(null);
  const {
    data: repeatPreview,
    isPending,
    error: repeatPreviewError,
  } = useQuery({
    queryKey: eventKeys.repeatPreview(familyId, previewRequest),
    queryFn: () =>
      fetchRepeatPreview(familyId, previewRequest as RepeatPreviewRequest),
    enabled: familyId !== '' && previewRequest !== null,
  });
  const isLoadingRepeatPreview = previewRequest !== null && isPending;

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
    mutationFn: (variables: DeleteEventVariables) =>
      deleteEventRequest(familyId, variables),
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
      previewRepeat: setPreviewRequest,
      repeatPreview: previewRequest === null ? undefined : repeatPreview,
      isLoadingRepeatPreview,
      repeatPreviewError: previewRequest === null ? null : repeatPreviewError,
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
      previewRequest,
      repeatPreview,
      isLoadingRepeatPreview,
      repeatPreviewError,
    ],
  );
  return (
    <EventsContext.Provider value={value}>{children}</EventsContext.Provider>
  );
}

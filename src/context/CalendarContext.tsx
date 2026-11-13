import React, { createContext, useCallback, useMemo, useState } from 'react';
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { custodyKeys } from '../api/custody';
import { eventKeys } from '../api/events';
import { ApiError } from '../api/errors';
import type { CalendarEvent, Custody } from '../api/types';
import {
  addDays,
  CalendarView,
  periodDates,
  shiftPeriod,
} from '../features/calendar/calendarDays';
import { useFamily } from '../hooks/useFamily';
import { todayInParis } from '../lib/dates';

// Requêtes HTTP de la garde calculée et des événements, appelées uniquement par CalendarProvider.

/** Garde calculée par le backend, du `from` au `to` inclus (92 jours au plus). */
async function fetchCustodyRequest(
  familyId: string,
  from: string,
  to: string,
): Promise<Custody> {
  const { data } = await apiClient.get<Custody>(
    `/api/v1/families/${familyId}/custody?from=${from}&to=${to}`,
  );
  return data;
}

/** Événements visibles qui touchent les jours `from` à `to` inclus (92 jours au plus). */
async function fetchEventsRequest(
  familyId: string,
  from: string,
  to: string,
): Promise<CalendarEvent[]> {
  const { data } = await apiClient.get<CalendarEvent[]>(
    `/api/v1/families/${familyId}/events?from=${from}&to=${to}`,
  );
  return data;
}

/** Jours chargés pour « Prochains passages », à partir d'aujourd'hui. */
const UPCOMING_DAYS = 60;

/**
 * Nouveaux essais comme le client de requêtes (`retry` par défaut), sauf quand aucun rythme
 * n'existe (404) : la réponse ne changera pas.
 */
function retryUnless404(defaultRetry: unknown) {
  return (failureCount: number, error: Error): boolean => {
    if (error instanceof ApiError && error.status === 404) {
      return false;
    }
    return typeof defaultRetry === 'number'
      ? failureCount < defaultRetry
      : defaultRetry === true;
  };
}

export type CalendarContextValue = {
  /** Date du jour à Paris (« AAAA-MM-JJ »). */
  today: string;
  view: CalendarView;
  /** Un jour de la période affichée (le 1er du mois après un changement de mois). */
  anchor: string;
  /** Jours affichés : 42 pour le mois (6 semaines), 7 pour la semaine. */
  dates: string[];
  showMonth: () => void;
  showWeek: () => void;
  showPrevious: () => void;
  showNext: () => void;
  /** Garde de la période affichée ; la précédente reste affichée pendant le chargement. */
  periodCustody: Custody | undefined;
  periodError: Error | null;
  /** Garde des deux prochains mois, pour les prochains passages. */
  upcomingCustody: Custody | undefined;
  /** Événements de la période affichée (les précédents restent pendant le chargement). */
  periodEvents: CalendarEvent[] | undefined;
  /** Événements d'aujourd'hui et des deux prochains mois (« À venir », accueil). */
  upcomingEvents: CalendarEvent[] | undefined;
  /** Échec du chargement des événements (la garde peut s'afficher quand même). */
  eventsError: Error | null;
  /** Recharge la période affichée, les prochains passages et les événements. */
  reloadCalendar: () => Promise<unknown>;
};

export const CalendarContext = createContext<CalendarContextValue | null>(null);

/**
 * Calendrier (onglet Calendrier) : la vue choisie (mois ou semaine), la période affichée,
 * sa garde calculée par le backend et ses événements, plus ce qui arrive dans les deux
 * prochains mois (prochains passages, événements ; aussi lu par l'accueil). Placé sous
 * FamilyProvider ; chargement et erreur sont affichés par les écrans.
 */
export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const { family } = useFamily();
  const familyId = family?.id ?? '';
  const today = todayInParis();
  const retry = retryUnless404(
    useQueryClient().getDefaultOptions().queries?.retry,
  );
  const [view, setView] = useState<CalendarView>('month');
  const [anchor, setAnchor] = useState(today);
  const dates = useMemo(() => periodDates(view, anchor), [view, anchor]);
  const from = dates[0];
  const to = dates[dates.length - 1];

  const period = useQuery({
    queryKey: custodyKeys.range(familyId, from, to),
    queryFn: () => fetchCustodyRequest(familyId, from, to),
    enabled: familyId !== '',
    placeholderData: keepPreviousData,
    retry,
  });
  const upcomingTo = addDays(today, UPCOMING_DAYS);
  const upcoming = useQuery({
    queryKey: custodyKeys.range(familyId, today, upcomingTo),
    queryFn: () => fetchCustodyRequest(familyId, today, upcomingTo),
    enabled: familyId !== '',
    retry,
  });
  const periodEvents = useQuery({
    queryKey: eventKeys.range(familyId, from, to),
    queryFn: () => fetchEventsRequest(familyId, from, to),
    enabled: familyId !== '',
    placeholderData: keepPreviousData,
  });
  const upcomingEvents = useQuery({
    queryKey: eventKeys.range(familyId, today, upcomingTo),
    queryFn: () => fetchEventsRequest(familyId, today, upcomingTo),
    enabled: familyId !== '',
  });
  const refetchPeriod = period.refetch;
  const refetchUpcoming = upcoming.refetch;
  const refetchPeriodEvents = periodEvents.refetch;
  const refetchUpcomingEvents = upcomingEvents.refetch;

  const showPrevious = useCallback(
    () => setAnchor(current => shiftPeriod(view, current, -1)),
    [view],
  );
  const showNext = useCallback(
    () => setAnchor(current => shiftPeriod(view, current, 1)),
    [view],
  );
  const reloadCalendar = useCallback(
    () =>
      Promise.all([
        refetchPeriod(),
        refetchUpcoming(),
        refetchPeriodEvents(),
        refetchUpcomingEvents(),
      ]),
    [
      refetchPeriod,
      refetchUpcoming,
      refetchPeriodEvents,
      refetchUpcomingEvents,
    ],
  );

  const value = useMemo<CalendarContextValue>(
    () => ({
      today,
      view,
      anchor,
      dates,
      showMonth: () => setView('month'),
      showWeek: () => setView('week'),
      showPrevious,
      showNext,
      periodCustody: period.data,
      periodError: period.error,
      upcomingCustody: upcoming.data,
      periodEvents: periodEvents.data,
      upcomingEvents: upcomingEvents.data,
      eventsError: periodEvents.error ?? upcomingEvents.error,
      reloadCalendar,
    }),
    [
      today,
      view,
      anchor,
      dates,
      showPrevious,
      showNext,
      period.data,
      period.error,
      upcoming.data,
      periodEvents.data,
      upcomingEvents.data,
      periodEvents.error,
      upcomingEvents.error,
      reloadCalendar,
    ],
  );
  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}

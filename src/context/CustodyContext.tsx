import React, { createContext, useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { custodyKeys } from '../api/custody';
import type { Custody } from '../api/types';
import { useFamily } from '../hooks/useFamily';
import { todayInParis } from '../lib/dates';

// Requêtes HTTP de la garde calculée, appelées uniquement par CustodyProvider.

/** Garde calculée par le backend, du `from` au `to` inclus (« AAAA-MM-JJ », 92 jours au plus). */
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

export type CustodyContextValue = {
  /** Date du jour à Paris (« AAAA-MM-JJ »), celle de la garde chargée. */
  today: string;
  /** Garde de ce soir et prochain passage ; undefined pendant le chargement ou après une erreur. */
  custody: Custody | undefined;
  isLoadingCustody: boolean;
  custodyError: Error | null;
  reloadCustody: () => void;
  /** Le détail d'un événement ouvre la garde de son jour (« AAAA-MM-JJ »), puis la lit. */
  openDayCustody: (date: string) => void;
  closeDayCustody: () => void;
  /** Garde du jour ouvert ; undefined pendant le chargement, après une erreur (pas de rythme…). */
  dayCustody: Custody | undefined;
};

export const CustodyContext = createContext<CustodyContextValue | null>(null);

/**
 * Charge la garde du jour (la nuit de ce soir et le prochain passage, renvoyé même hors
 * période) pour les écrans qu'il entoure, et à la demande la garde d'un autre jour (détail
 * d'un événement). Placé sous FamilyProvider, une fois la famille créée. Chargement et erreur
 * sont affichés par les écrans.
 */
export function CustodyProvider({ children }: { children: React.ReactNode }) {
  const { family } = useFamily();
  const familyId = family?.id ?? '';
  const today = todayInParis();
  const { data, isPending, error, refetch } = useQuery({
    queryKey: custodyKeys.range(familyId, today, today),
    queryFn: () => fetchCustodyRequest(familyId, today, today),
    enabled: familyId !== '',
  });

  const [day, setDay] = useState<string | null>(null);
  const { data: dayCustody } = useQuery({
    queryKey: custodyKeys.range(familyId, day ?? '', day ?? ''),
    queryFn: () => fetchCustodyRequest(familyId, day as string, day as string),
    enabled: familyId !== '' && day !== null,
  });
  const closeDayCustody = useCallback(() => setDay(null), []);

  const value = useMemo<CustodyContextValue>(
    () => ({
      today,
      custody: data,
      isLoadingCustody: isPending,
      custodyError: error,
      reloadCustody: () => {
        refetch();
      },
      openDayCustody: setDay,
      closeDayCustody,
      dayCustody: day === null ? undefined : dayCustody,
    }),
    [today, data, isPending, error, refetch, closeDayCustody, day, dayCustody],
  );
  return (
    <CustodyContext.Provider value={value}>{children}</CustodyContext.Provider>
  );
}

import React, { createContext, useMemo, useState } from 'react';
import type { ScheduleDraft } from '../schemas/custody';

export type OnboardingDraftValue = {
  /** Étape 4 : rythme choisi, en attente des règles de vacances (rien n'est encore envoyé). */
  schedule: ScheduleDraft | null;
  setSchedule: (schedule: ScheduleDraft) => void;
};

export const OnboardingDraftContext =
  createContext<OnboardingDraftValue | null>(null);

/** Choix de la première connexion gardés entre deux écrans avant leur envoi au serveur. */
export function OnboardingDraftProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [schedule, setSchedule] = useState<ScheduleDraft | null>(null);
  const value = useMemo(() => ({ schedule, setSchedule }), [schedule]);
  return (
    <OnboardingDraftContext.Provider value={value}>
      {children}
    </OnboardingDraftContext.Provider>
  );
}

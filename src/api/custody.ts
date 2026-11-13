export const custodyKeys = {
  /** Toute la garde chargée de la famille (accueil, calendrier). */
  all: (familyId: string) => ['custody', familyId] as const,
  range: (familyId: string, from: string, to: string) =>
    ['custody', familyId, from, to] as const,
};

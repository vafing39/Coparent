export const custodyKeys = {
  range: (familyId: string, from: string, to: string) =>
    ['custody', familyId, from, to] as const,
};

import type { Family } from '../api/types';

/** Famille factice, au format du backend, juste après l'étape 2. */
export function family(overrides: Partial<Family> = {}): Family {
  return {
    id: '7f1e2d3c-0000-0000-0000-000000000001',
    name: 'Famille Martin',
    vacationZone: 'A',
    myRole: 'PARENT_A',
    solo: true,
    members: [
      {
        userId: '0c3b6a2e-0000-0000-0000-000000000001',
        firstName: 'Camille',
        role: 'PARENT_A',
      },
    ],
    children: [],
    custodySchedule: null,
    ...overrides,
  };
}

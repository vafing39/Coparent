import type { CustodySchedule, InvitationPreview } from '../api/types';

/** Jeton au format du backend (32 octets en base64url). */
export const INVITATION_TOKEN = 'q3Jx0w8vT2mY6kZpLs4NbRcHd1EaFgUi5oVtWnXy7Q8';

export const INVITATION_URL = `coparent://invitation?token=${INVITATION_TOKEN}`;

/** Aperçu factice : Camille invite, deux enfants, une semaine sur deux le vendredi à 17 h 50. */
export function invitationPreview(
  overrides: Partial<InvitationPreview> = {},
): InvitationPreview {
  const schedule: CustodySchedule = {
    id: 's1',
    pattern: 'ALTERNATE_WEEKS',
    customSequence: null,
    startDate: '2026-11-13', // un vendredi
    handoverTime: '17:50:00',
    startingParent: 'PARENT_A',
    holidayFirstHalfEvenYears: 'PARENT_A',
    summerSplit: 'FORTNIGHTS',
    status: 'PROPOSED',
    proposedById: 'u1',
    proposedByFirstName: 'Camille',
  };
  return {
    inviterFirstName: 'Camille',
    children: [
      { firstName: 'Léa', age: 8 },
      { firstName: 'Hugo', age: 5 },
    ],
    custodySchedule: schedule,
    expiresAt: '2026-11-17T10:00:00Z',
    ...overrides,
  };
}

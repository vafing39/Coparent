import type { VacationZone } from '../schemas/family';

/**
 * Types des réponses du backend (/api/v1). PROVISOIRE : écrits à la main en
 * attendant leur génération depuis l'OpenAPI du backend.
 */

/** UserResponse côté backend. Dates ISO 8601 en UTC. */
export type User = {
  id: string;
  email: string;
  firstName: string;
  emailVerified: boolean;
  createdAt: string;
};

/** AuthResponse côté backend : réponse de l'inscription, de la connexion et du rafraîchissement. */
export type AuthResponse = {
  tokenType: 'Bearer';
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: User;
};

export type FamilyRole = 'PARENT_A' | 'PARENT_B';

/** MemberResponse côté backend. */
export type FamilyMember = {
  userId: string;
  firstName: string;
  role: FamilyRole;
};

/** ChildResponse côté backend. birthDate : date locale « AAAA-MM-JJ ». */
export type Child = {
  id: string;
  firstName: string;
  birthDate: string;
};

/** CustodyScheduleResponse côté backend. */
export type CustodySchedule = {
  id: string;
  pattern:
    | 'ALTERNATE_WEEKS'
    | 'TWO_TWO_THREE'
    | 'TWO_TWO_FIVE_FIVE'
    | 'ALTERNATE_WEEKENDS_WEDNESDAY'
    | 'CUSTOM';
  customSequence: string | null;
  startDate: string;
  handoverTime: string;
  startingParent: FamilyRole;
  holidayFirstHalfEvenYears: FamilyRole;
  summerSplit: 'FORTNIGHTS' | 'MONTHS';
  status: 'PROPOSED' | 'ACTIVE' | 'REPLACED' | 'REJECTED';
};

/** FamilyResponse côté backend : la famille vue par l'un de ses membres. */
export type Family = {
  id: string;
  name: string;
  vacationZone: VacationZone;
  myRole: FamilyRole;
  /** Un seul parent pour l'instant. */
  solo: boolean;
  members: FamilyMember[];
  children: Child[];
  custodySchedule: CustodySchedule | null;
};

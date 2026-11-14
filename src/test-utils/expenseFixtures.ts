import type { Expense } from '../api/types';

/** Dépense factice, au format du backend : payée par Camille (A), 50/50, pour Léa, en attente. */
export function expense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'exp-1',
    status: 'PENDING',
    label: 'Licence de judo',
    amountCents: 8500,
    category: 'ACTIVITIES',
    children: [{ id: 'c1', firstName: 'Léa' }],
    payerRole: 'PARENT_A',
    paidOn: '2026-11-08',
    payerSharePercent: 50,
    owedCents: 4250,
    authorRole: 'PARENT_A',
    authorFirstName: 'Camille',
    mine: true,
    canAnswer: false,
    canEdit: true,
    contestReason: null,
    contestNote: null,
    receiptUpdatedAt: null,
    createdAt: '2026-11-08T10:00:00Z',
    answeredAt: null,
    ...overrides,
  };
}

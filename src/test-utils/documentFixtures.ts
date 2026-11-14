import type { FamilyDocument } from '../api/types';

/** Document factice, au format du backend : un PDF ajouté par Camille (A), pour tous les enfants. */
export function document(
  overrides: Partial<FamilyDocument> = {},
): FamilyDocument {
  return {
    id: 'doc-1',
    title: 'Jugement du 14 mars 2025',
    category: 'JUDGMENT',
    childId: null,
    childFirstName: null,
    contentType: 'application/pdf',
    sizeBytes: 248_000,
    authorRole: 'PARENT_A',
    authorFirstName: 'Camille',
    canDelete: true,
    createdAt: '2026-09-02T08:00:00Z',
    deletedAt: null,
    deletedByRole: null,
    history: [],
    ...overrides,
  };
}

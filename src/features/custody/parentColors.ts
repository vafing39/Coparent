import type { FamilyRole } from '../../api/types';

/** Bordure de la couleur d'un parent (couleurs de garde : toujours avec l'initiale). */
export const DASHED: Record<FamilyRole, string> = {
  PARENT_A: 'border-parent-a',
  PARENT_B: 'border-parent-b',
};

/** Bordure et fond doux de la couleur d'un parent. */
export const SOFT: Record<FamilyRole, string> = {
  PARENT_A: 'border-parent-a bg-parent-a-soft',
  PARENT_B: 'border-parent-b bg-parent-b-soft',
};

/** Fond doux de la couleur d'un parent, sans bordure (cases du calendrier). */
export const SOFT_BG: Record<FamilyRole, string> = {
  PARENT_A: 'bg-parent-a-soft',
  PARENT_B: 'bg-parent-b-soft',
};

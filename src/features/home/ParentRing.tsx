import React from 'react';
import { Text, View } from 'react-native';
import type { FamilyRole } from '../../api/types';

/** Couleurs de garde : toujours accompagnées de l'initiale. */
const RING: Record<FamilyRole, string> = {
  PARENT_A: 'border-parent-a',
  PARENT_B: 'border-parent-b',
};

const SIZE = {
  md: 'h-11 w-11 border-[3px]',
  sm: 'h-8 w-8 border-2',
};

const TEXT = {
  md: 'text-[17px]',
  sm: 'text-[13px]',
};

type Props = {
  role: FamilyRole;
  /** Initiale du parent, « ? » s'il n'a pas encore rejoint la famille. */
  initial: string;
  size?: keyof typeof SIZE;
};

/** Initiale d'un parent dans un anneau de sa couleur. Décoratif : le texte voisin dit qui c'est. */
export function ParentRing({ role, initial, size = 'md' }: Props) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={`items-center justify-center rounded-full bg-card ${SIZE[size]} ${RING[role]}`}
    >
      <Text className={`font-extrabold text-text ${TEXT[size]}`}>
        {initial}
      </Text>
    </View>
  );
}

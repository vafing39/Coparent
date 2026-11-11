import React from 'react';
import { Text, View } from 'react-native';
import type { FamilyRole } from '../../api/types';
import { PlusIcon } from '../../components/icons';
import { useTheme } from '../../theme/ThemeProvider';

/** Couleurs de garde : toujours accompagnées de l'initiale (ou du « + » pour l'invité). */
const PARENT_AVATAR: Record<FamilyRole, string> = {
  PARENT_A: 'border-parent-a bg-parent-a-soft',
  PARENT_B: 'border-parent-b bg-parent-b-soft',
};

type Props = {
  /** Parent déjà dans la famille. */
  initial: string;
  role: FamilyRole;
};

/** Les deux parents de l'invitation : le parent qui invite, puis l'autre (« + » en pointillés). Décoratif. */
export function ParentAvatars({ initial, role }: Props) {
  const { color } = useTheme();
  const otherRole: FamilyRole = role === 'PARENT_A' ? 'PARENT_B' : 'PARENT_A';
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="flex-row items-center"
    >
      <View
        className={`h-14 w-14 items-center justify-center rounded-full border-[3px] ${PARENT_AVATAR[role]}`}
      >
        <Text className="font-extrabold text-[20px] text-text">
          {initial.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View
        className={`-ml-2.5 h-14 w-14 items-center justify-center rounded-full border-[3px] border-dashed ${PARENT_AVATAR[otherRole]}`}
      >
        <PlusIcon color={color('text')} />
      </View>
    </View>
  );
}

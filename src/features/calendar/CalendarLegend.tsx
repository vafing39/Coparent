import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Family, FamilyRole } from '../../api/types';
import { LockIcon } from '../../components/icons';
import { useTheme } from '../../theme/ThemeProvider';
import { ParentRing } from '../custody/ParentRing';
import { parentOf } from '../custody/parents';

const ROLES: FamilyRole[] = ['PARENT_A', 'PARENT_B'];

/** Légende : l'initiale et le prénom de chaque parent, puis les marques des événements. */
export function CalendarLegend({ family }: { family: Family }) {
  const { t } = useTranslation();
  const { color } = useTheme();
  return (
    <View className="flex-row flex-wrap items-center gap-3 px-0.5">
      {ROLES.map(role => {
        const { name, initial } = parentOf(family, role);
        return (
          <View key={role} className="flex-row items-center gap-1.5">
            <ParentRing role={role} initial={initial} size="xs" />
            <Text className="font-regular text-[13px] text-text">{name}</Text>
          </View>
        );
      })}
      <View className="flex-row items-center gap-1.5">
        <View className="h-2 w-2 rounded-full bg-shared" />
        <Text className="font-regular text-[13px] text-text">
          {t('calendar.legendShared')}
        </Text>
      </View>
      <View className="flex-row items-center gap-1">
        <LockIcon size={12} color={color('pending')} />
        <Text className="font-regular text-[13px] text-text">
          {t('calendar.legendPrivate')}
        </Text>
      </View>
    </View>
  );
}

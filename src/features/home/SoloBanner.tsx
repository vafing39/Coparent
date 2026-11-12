import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { FamilyRole } from '../../api/types';
import { DASHED, SOFT } from './parentColors';

/** Mode solo : l'autre parent (de rôle `otherRole`) n'a pas encore rejoint la famille. */
export function SoloBanner({ otherRole }: { otherRole: FamilyRole }) {
  const { t } = useTranslation();
  return (
    <View
      className={`flex-row items-center gap-3 rounded-[20px] border-2 border-dashed bg-card p-4 ${DASHED[otherRole]}`}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className={`h-10 w-10 items-center justify-center rounded-full border-2 border-dashed ${SOFT[otherRole]}`}
      >
        <Text className="font-extrabold text-[15px] text-text">?</Text>
      </View>
      <Text className="flex-1 font-bold text-[15px] leading-[21px] text-text">
        {t('home.solo')}
      </Text>
    </View>
  );
}

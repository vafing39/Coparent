import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { VACATION_ZONES } from '../../schemas/family';

/** Chargement : la forme de l'écran, sans contenu. */
export function FamilySkeleton() {
  const { t } = useTranslation();
  return (
    <View
      accessible
      accessibilityLabel={t('common.loading')}
      className="flex-1 gap-5 px-6 pt-6"
    >
      <View className="gap-2">
        <View className="h-[34px] w-3/4 rounded-md bg-surface" />
        <View className="h-[21px] w-full rounded-md bg-surface" />
      </View>
      <View className="h-[52px] rounded-md bg-surface" />
      {VACATION_ZONES.map(zone => (
        <View key={zone} className="h-[56px] rounded-md bg-surface" />
      ))}
    </View>
  );
}

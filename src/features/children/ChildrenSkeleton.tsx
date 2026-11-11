import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

/** Chargement : la forme de l'écran, sans contenu. */
export function ChildrenSkeleton() {
  const { t } = useTranslation();
  return (
    <View
      accessible
      accessibilityLabel={t('common.loading')}
      className="flex-1 gap-4 px-6 pt-6"
    >
      <View className="gap-2">
        <View className="h-[34px] w-3/4 rounded-md bg-surface" />
        <View className="h-[42px] w-full rounded-md bg-surface" />
      </View>
      <View className="h-[220px] rounded-2xl bg-surface" />
      <View className="h-[52px] rounded-2xl bg-surface" />
    </View>
  );
}

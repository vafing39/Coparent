import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

/** Chargement d'un écran : la forme d'un titre et de quelques blocs, sans contenu. */
export function ScreenSkeleton() {
  const { t } = useTranslation();
  return (
    <View
      accessible
      accessibilityLabel={t('common.loading')}
      className="flex-1 gap-5 px-6 pt-6"
    >
      <View className="h-[6px] w-full rounded-full bg-surface" />
      <View className="gap-2">
        <View className="h-[34px] w-3/4 rounded-md bg-surface" />
        <View className="h-[21px] w-full rounded-md bg-surface" />
      </View>
      <View className="h-[52px] rounded-md bg-surface" />
      <View className="h-[160px] rounded-2xl bg-surface" />
      <View className="h-[52px] rounded-md bg-surface" />
    </View>
  );
}

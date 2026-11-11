import React from 'react';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Écran provisoire pour une route dont la fonction n'est pas encore construite. */
export function PlaceholderScreen({ title }: { title: string }) {
  const { t } = useTranslation();
  return (
    <SafeAreaView
      className="flex-1 items-center justify-center bg-background px-6"
      edges={['bottom']}
    >
      <Text className="font-bold text-lg text-text text-center">{title}</Text>
      <Text className="font-regular text-sm text-text-secondary text-center mt-2">
        {t('common.screenComingSoon')}
      </Text>
    </SafeAreaView>
  );
}

import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

/** Séparateur « ou » entre deux façons de faire ; décoratif, ignoré par les lecteurs d'écran. */
export function OrDivider() {
  const { t } = useTranslation();
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      className="flex-row items-center gap-3"
    >
      <View className="h-px flex-1 bg-border" />
      <Text className="font-bold text-[13px] text-text-secondary">
        {t('common.or')}
      </Text>
      <View className="h-px flex-1 bg-border" />
    </View>
  );
}

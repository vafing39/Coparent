import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import { ChevronLeftIcon } from './icons';

/** En-tête d'un écran ouvert par-dessus les onglets : flèche retour et titre. */
export function BackHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const { color } = useTheme();
  return (
    <View className="flex-row items-center gap-1 pb-2 pl-2 pr-4 pt-6">
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        className="h-12 w-12 items-center justify-center rounded-full"
      >
        <ChevronLeftIcon color={color('text')} />
      </Pressable>
      <Text
        accessibilityRole="header"
        className="flex-1 font-extrabold text-[22px] leading-[28px] text-text"
      >
        {title}
      </Text>
    </View>
  );
}

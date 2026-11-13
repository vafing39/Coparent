import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MessageIcon } from '../../components/icons';
import { useTheme } from '../../theme/ThemeProvider';

/**
 * Discussion « Bienvenue » épinglée en tête de la liste. Affichée par l'app (rien en base) ;
 * elle ouvre `WelcomeScreen`.
 */
export function WelcomeRow({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const preview = t('messages.welcome.preview');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('messages.welcome.rowLabel', { preview })}
      className="min-h-[64px] flex-row items-center gap-3 py-3 active:opacity-70"
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-soft">
        <MessageIcon size={20} color={color('primary')} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text numberOfLines={1} className="font-bold text-[15px] text-text">
          {t('messages.welcome.title')}
        </Text>
        <Text
          numberOfLines={1}
          className="font-regular text-[13px] text-text-secondary"
        >
          {preview}
        </Text>
      </View>
      <Text className="font-regular text-[12px] text-text-secondary">
        {t('messages.welcome.from')}
      </Text>
    </Pressable>
  );
}

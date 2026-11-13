import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronLeftIcon } from '../../components/icons';
import { useTheme } from '../../theme/ThemeProvider';

/** En-tête des sous-écrans de la répétition : retour (sans rien changer), titre, « OK ». */
export function RepeatHeader({
  title,
  subtitle,
  onCancel,
  onDone,
}: {
  title: string;
  subtitle?: string;
  onCancel: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const { color } = useTheme();
  return (
    <View className="flex-row items-center gap-1 pb-1 pl-2 pr-3 pt-6">
      <Pressable
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        className="h-12 w-12 items-center justify-center rounded-full"
      >
        <ChevronLeftIcon color={color('text')} />
      </Pressable>
      <View className="flex-1">
        <Text
          accessibilityRole="header"
          className="font-extrabold text-[22px] leading-[28px] text-text"
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={1}
            className="font-regular text-[13px] text-text-secondary"
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={onDone}
        accessibilityRole="button"
        className="min-h-[44px] justify-center rounded-full bg-primary px-[18px]"
      >
        <Text className="font-extrabold text-[15px] text-on-primary">
          {t('events.repeat.ok')}
        </Text>
      </Pressable>
    </View>
  );
}

/** Bouton rond « − » ou « + » d'un compteur. */
export function Stepper({
  label,
  sign,
  onPress,
}: {
  label: string;
  sign: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-text-secondary bg-card"
    >
      <Text className="font-bold text-[20px] text-text">{sign}</Text>
    </Pressable>
  );
}

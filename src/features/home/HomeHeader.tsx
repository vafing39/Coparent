import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { GearIcon } from '../../components/icons';
import { useTheme } from '../../theme/ThemeProvider';
import { formatLongDate, todayInParis } from '../../lib/dates';

type Props = {
  now: Date;
  onOpenAccount: () => void;
};

/** Date du jour et roue dentée (ouvre « Compte et famille »). */
export function HomeHeader({ now, onOpenAccount }: Props) {
  const { t } = useTranslation();
  const { color } = useTheme();

  return (
    <View className="flex-row items-center justify-between gap-3 pt-2">
      <Text
        accessibilityRole="header"
        className="flex-1 font-semibold text-[13px] text-text-secondary"
      >
        {formatLongDate(todayInParis(now))}
      </Text>
      <Pressable
        onPress={onOpenAccount}
        accessibilityRole="button"
        accessibilityLabel={t('home.account.label')}
        accessibilityHint={t('home.account.hint')}
        className="h-12 w-12 items-center justify-center rounded-full bg-primary-soft"
      >
        <GearIcon size={24} color={color('primary')} />
      </Pressable>
    </View>
  );
}

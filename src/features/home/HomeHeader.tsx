import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatLongDate, hourInParis, todayInParis } from '../../lib/dates';

/** Heure (Paris) à partir de laquelle on dit « Bonsoir ». */
const EVENING_HOUR = 18;

type Props = {
  firstName: string;
  now: Date;
  onSignOut: () => void;
};

/**
 * Date du jour, salutation et avatar. PROVISOIRE : l'avatar ouvre un menu de déconnexion,
 * en attendant l'écran « Compte et famille ».
 */
export function HomeHeader({ firstName, now, onSignOut }: Props) {
  const { t } = useTranslation();
  const greeting =
    hourInParis(now) >= EVENING_HOUR ? 'home.greetingEvening' : 'home.greeting';

  const openAccountMenu = () =>
    Alert.alert(t('home.account.title'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.signOut'), style: 'destructive', onPress: onSignOut },
    ]);

  return (
    <View className="flex-row items-end justify-between gap-3 pt-2">
      <View className="flex-1 gap-0.5">
        <Text className="font-semibold text-[13px] text-text-secondary">
          {formatLongDate(todayInParis(now))}
        </Text>
        <Text
          accessibilityRole="header"
          className="font-extrabold text-[30px] leading-[36px] text-text"
        >
          {t(greeting, { firstName })}
        </Text>
      </View>
      <Pressable
        onPress={openAccountMenu}
        accessibilityRole="button"
        accessibilityLabel={t('home.account.label')}
        className="h-12 w-12 items-center justify-center rounded-full bg-primary-soft"
      >
        <Text className="font-extrabold text-[17px] text-primary">
          {firstName.charAt(0).toUpperCase()}
        </Text>
      </Pressable>
    </View>
  );
}

import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { FamilyRole } from '../../api/types';
import { ChevronLeftIcon } from '../../components/icons';
import { useFamily } from '../../hooks/useFamily';
import type { AppScreenProps } from '../../navigation/types';
import { useTheme } from '../../theme/ThemeProvider';
import { parentOf } from '../custody/parents';

/**
 * Discussion « Bienvenue » : un message de Coparent, affiché par l'app (rien en base), sans
 * réponse possible. S'ouvre par-dessus les onglets, comme une discussion.
 */
export function WelcomeScreen({ navigation }: AppScreenProps<'Welcome'>) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const { family } = useFamily();

  if (!family) {
    return null;
  }
  const otherRole: FamilyRole =
    family.myRole === 'PARENT_A' ? 'PARENT_B' : 'PARENT_A';
  const body = t('messages.welcome.body', {
    name: parentOf(family, family.myRole).name,
    other: parentOf(family, otherRole).name,
  });

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-row items-center gap-1 border-b border-border pb-3 pl-2 pr-4 pt-6">
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          className="h-12 w-12 items-center justify-center rounded-full"
        >
          <ChevronLeftIcon color={color('text')} />
        </Pressable>
        <View className="flex-1">
          <Text
            accessibilityRole="header"
            className="font-extrabold text-[20px] leading-[26px] text-text"
          >
            {t('messages.welcome.title')}
          </Text>
          <Text className="font-regular text-[13px] text-text-secondary">
            {t('messages.welcome.subtitle')}
          </Text>
        </View>
      </View>
      <ScrollView contentContainerClassName="px-4 py-3">
        <View
          accessible
          accessibilityLabel={t('messages.bubbleLabel', {
            author: t('messages.welcome.from'),
            status: t('messages.welcome.pinned'),
            body,
          })}
          className="max-w-[80%] self-start"
        >
          <Text className="rounded-[20px] rounded-tl-md bg-card px-3.5 py-3 font-regular text-[15px] leading-[21px] text-text">
            {body}
          </Text>
        </View>
      </ScrollView>
      <Text className="border-t border-border px-6 py-4 text-center font-regular text-[13px] text-text-secondary">
        {t('messages.welcome.noReply')}
      </Text>
    </SafeAreaView>
  );
}

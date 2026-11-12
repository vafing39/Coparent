import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeftIcon } from '../../components/icons';
import type { AppScreenProps } from '../../navigation/types';
import { useTheme } from '../../theme/ThemeProvider';

/**
 * « À traiter » : tout ce qui attend une réponse (cahier des charges, 8). Vide en attendant
 * les demandes (dépenses, échanges, validations).
 */
export function ATraiterScreen({ navigation }: AppScreenProps<'ATraiter'>) {
  const { t } = useTranslation();
  const { color } = useTheme();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center gap-1 pb-1 pl-2 pr-4 pt-6">
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          className="h-12 w-12 items-center justify-center rounded-full"
        >
          <ChevronLeftIcon color={color('text')} />
        </Pressable>
        <Text
          accessibilityRole="header"
          className="flex-1 font-extrabold text-[24px] text-text"
        >
          {t('home.toDo.title')}
        </Text>
      </View>
      <ScrollView contentContainerClassName="px-4 pt-1 pb-6">
        <View className="rounded-[20px] border border-border bg-card p-[18px]">
          <Text className="font-regular text-[15px] leading-[21px] text-text-secondary">
            {t('home.toDo.empty')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

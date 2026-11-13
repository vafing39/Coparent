import React from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackHeader } from '../../components/BackHeader';
import { RadioCard } from '../../components/RadioCard';
import type { AppScreenProps } from '../../navigation/types';
import { Appearance, usePreferences } from '../../stores/preferences';

const APPEARANCES: Appearance[] = ['system', 'light', 'dark'];

/** « Apparence » (cahier des charges, 11) : celle du téléphone, claire ou sombre, sur ce téléphone. */
export function AppearanceScreen({ navigation }: AppScreenProps<'Apparence'>) {
  const { t } = useTranslation();
  const { appearance, setAppearance } = usePreferences();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <BackHeader
        title={t('settings.appearance.title')}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerClassName="px-4 pt-2 pb-8">
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel={t('settings.appearance.title')}
          className="gap-2"
        >
          {APPEARANCES.map(option => (
            <RadioCard
              key={option}
              label={t(`settings.appearance.${option}`)}
              hint={
                option === 'system'
                  ? t('settings.appearance.systemHint')
                  : undefined
              }
              checked={appearance === option}
              onPress={() => setAppearance(option)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

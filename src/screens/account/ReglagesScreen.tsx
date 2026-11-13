import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { FamilyRole } from '../../api/types';
import { BackHeader } from '../../components/BackHeader';
import { Button } from '../../components/Button';
import { RadioCard } from '../../components/RadioCard';
import { ParentRing } from '../../features/custody/ParentRing';
import { SOFT } from '../../features/custody/parentColors';
import { parentOf } from '../../features/custody/parents';
import { useFamily } from '../../hooks/useFamily';
import type { AppScreenProps } from '../../navigation/types';
import { Appearance, usePreferences } from '../../stores/preferences';

const APPEARANCES: Appearance[] = ['system', 'light', 'dark'];
const ROLES: FamilyRole[] = ['PARENT_A', 'PARENT_B'];

/**
 * Réglages de ce téléphone (cahier des charges, 11) : apparence et couleurs des parents
 * (interverties sur ce téléphone seulement, cahier des charges, 4).
 */
export function ReglagesScreen({ navigation }: AppScreenProps<'Reglages'>) {
  const { t } = useTranslation();
  const { family } = useFamily();
  const {
    appearance,
    setAppearance,
    swapParentColors,
    toggleSwapParentColors,
  } = usePreferences();

  if (!family) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <BackHeader
        title={t('settings.title')}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerClassName="gap-6 px-4 pt-2 pb-8">
        <View className="gap-2">
          <Text
            accessibilityRole="header"
            className="mx-1 font-bold text-[13px] text-text-secondary"
          >
            {t('settings.appearance.title')}
          </Text>
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
        </View>

        <View className="gap-2">
          <Text
            accessibilityRole="header"
            className="mx-1 font-bold text-[13px] text-text-secondary"
          >
            {t('settings.colors.title')}
          </Text>
          <View className="gap-3 rounded-[20px] border border-border bg-card p-4">
            <View className="flex-row gap-2">
              {ROLES.map(role => {
                const parent = parentOf(family, role);
                return (
                  <View
                    key={role}
                    accessible
                    className={`flex-1 flex-row items-center gap-2.5 rounded-2xl border-2 px-3 py-2.5 ${SOFT[role]}`}
                  >
                    <ParentRing
                      role={role}
                      initial={parent.initial}
                      size="sm"
                    />
                    <Text
                      numberOfLines={1}
                      className="flex-1 font-bold text-[15px] text-text"
                    >
                      {parent.name}
                    </Text>
                  </View>
                );
              })}
            </View>
            <Button
              label={t('settings.colors.swap')}
              variant="secondary"
              compact
              onPress={toggleSwapParentColors}
              accessibilityHint={
                swapParentColors
                  ? t('settings.colors.swappedHint')
                  : t('settings.colors.swapHint')
              }
            />
            <Text className="font-regular text-[13px] text-text-secondary">
              {t('settings.colors.note')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

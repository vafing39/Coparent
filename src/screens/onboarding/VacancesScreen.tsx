import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeftIcon } from '../../components/icons';
import { HolidayRulesForm } from '../../features/custody/HolidayRulesForm';
import { RequireFamily } from '../../features/family/RequireFamily';
import { useOnboardingDraft } from '../../hooks/useOnboardingDraft';
import {
  DEFAULT_HOLIDAYS,
  DEFAULT_SCHEDULE,
  fromSchedule,
} from '../../schemas/custody';
import type { OnboardingScreenProps } from '../../navigation/types';
import { useTheme } from '../../theme/ThemeProvider';

/**
 * Étape 4, sous-réglage : vacances scolaires. Envoie le rythme choisi à l'écran
 * précédent avec ces règles, puis passe à l'invitation.
 */
export function VacancesScreen({
  navigation,
}: OnboardingScreenProps<'Vacances'>) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const draft = useOnboardingDraft();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-row items-center gap-1 pl-2 pr-6 pt-6">
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          className="h-12 w-12 items-center justify-center rounded-full active:opacity-60"
        >
          <ChevronLeftIcon color={color('text')} />
        </Pressable>
        <Text
          accessibilityRole="header"
          className="flex-1 font-extrabold text-[24px] text-text"
        >
          {t('onboarding.holidays.title')}
        </Text>
      </View>

      <RequireFamily onBack={() => navigation.goBack()}>
        {family => {
          const saved = family.custodySchedule
            ? fromSchedule(family.custodySchedule, family.myRole)
            : null;
          return (
            <HolidayRulesForm
              family={family}
              // Normalement rempli par l'écran Rythme ; sinon le rythme enregistré.
              schedule={draft.schedule ?? saved?.schedule ?? DEFAULT_SCHEDULE}
              initial={saved?.holidays ?? DEFAULT_HOLIDAYS}
              onSaved={() => navigation.navigate('Invitation')}
            />
          );
        }}
      </RequireFamily>
    </SafeAreaView>
  );
}

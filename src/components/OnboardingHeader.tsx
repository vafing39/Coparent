import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import { ChevronLeftIcon } from './icons';
import { OnboardingProgress } from './OnboardingProgress';

type Props = {
  step: number;
  /** Sans onBack, pas de flèche (ex. étape 2 : rien avant une fois l'email vérifié). */
  onBack?: () => void;
  /** Par défaut « Revenir à l'étape précédente ». */
  backHint?: string;
};

/** En-tête des étapes de la première connexion : flèche de retour et progression. */
export function OnboardingHeader({ step, onBack, backHint }: Props) {
  const { t } = useTranslation();
  const { color } = useTheme();

  return (
    <View
      className={`flex-row items-center gap-2 pr-6 pt-2 ${
        onBack ? 'pl-2' : 'pl-6 pt-6'
      }`}
    >
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          accessibilityHint={backHint ?? t('onboarding.previousStepHint')}
          className="h-12 w-12 items-center justify-center rounded-full"
        >
          <ChevronLeftIcon color={color('text')} />
        </Pressable>
      ) : null}
      <OnboardingProgress step={step} />
    </View>
  );
}

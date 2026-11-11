import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export const ONBOARDING_STEPS = 5;

/** « Étape n sur 5 » et une barre à 5 segments (parcours de première connexion). */
export function OnboardingProgress({ step }: { step: number }) {
  const { t } = useTranslation();
  const values = { step, total: ONBOARDING_STEPS };
  return (
    <View className="flex-1 gap-1.5">
      <Text
        importantForAccessibility="no"
        accessibilityElementsHidden
        className="font-bold text-[13px] text-text-secondary"
      >
        {t('onboarding.progress.label', values)}
      </Text>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={t('onboarding.progress.accessibilityLabel', values)}
        accessibilityValue={{ min: 1, max: ONBOARDING_STEPS, now: step }}
        className="flex-row gap-1"
      >
        {Array.from({ length: ONBOARDING_STEPS }, (_, index) => (
          <View
            key={index}
            className={`h-1.5 flex-1 rounded-full ${
              index < step ? 'bg-primary' : 'bg-border'
            }`}
          />
        ))}
      </View>
    </View>
  );
}

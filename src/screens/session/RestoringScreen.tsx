import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';

/** Pendant la reprise de la session au démarrage. */
export function RestoringScreen() {
  const { color } = useTheme();
  const { t } = useTranslation();
  return (
    <View
      className="flex-1 items-center justify-center bg-background"
      accessibilityLabel={t('common.loading')}
      accessibilityRole="progressbar"
    >
      <ActivityIndicator size="large" color={color('primary')} />
    </View>
  );
}

import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

/** Pendant la reprise de la session au démarrage. */
export function RestoringScreen() {
  const { color } = useTheme();
  return (
    <View
      className="flex-1 items-center justify-center bg-background"
      accessibilityLabel="Chargement"
      accessibilityRole="progressbar"
    >
      <ActivityIndicator size="large" color={color('primary')} />
    </View>
  );
}

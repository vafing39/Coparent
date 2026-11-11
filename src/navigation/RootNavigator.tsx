import React, { useMemo } from 'react';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  Theme,
} from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { AuthNavigator } from './AuthNavigator';

export function RootNavigator() {
  const { scheme, color } = useTheme();

  const navigationTheme = useMemo<Theme>(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: color('primary'),
        background: color('background'),
        card: color('background'),
        text: color('text'),
        border: color('border'),
        notification: color('error'),
      },
    };
  }, [scheme, color]);

  // La vérification de session (Auth ou Tabs) viendra avec la fonction « Connexion ».
  return (
    <NavigationContainer theme={navigationTheme}>
      <AuthNavigator />
    </NavigationContainer>
  );
}

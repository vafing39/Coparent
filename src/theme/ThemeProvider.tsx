import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { Appearance, useColorScheme, View } from 'react-native';
import { vars } from 'nativewind';
import { usePreferences } from '../stores/preferences';
import { color, colorVariables, ColorScheme, ColorToken } from './tokens';

type Theme = {
  scheme: ColorScheme;
  /** Couleur résolue, pour les API qui n'acceptent pas de className. */
  color: (token: ColorToken) => string;
};

const ThemeContext = createContext<Theme>({
  scheme: 'light',
  color: token => color(token, 'light'),
});

/** Variables NativeWind par thème, couleurs des parents interverties ou non. */
const themeVariables = {
  light: {
    normal: vars(colorVariables('light')),
    swapped: vars(colorVariables('light', true)),
  },
  dark: {
    normal: vars(colorVariables('dark')),
    swapped: vars(colorVariables('dark', true)),
  },
};

/**
 * Expose les jetons du thème courant à NativeWind : clair ou sombre selon le téléphone
 * (useColorScheme) ou le choix des réglages, couleurs des parents interverties si demandé.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const appearance = usePreferences(state => state.appearance);
  const swap = usePreferences(state => state.swapParentColors);
  const systemScheme = useColorScheme();

  useEffect(() => {
    // Les éléments natifs (sélecteur d'heure, alertes) suivent le choix des réglages.
    Appearance.setColorScheme?.(
      appearance === 'system' ? 'unspecified' : appearance,
    );
  }, [appearance]);

  const scheme: ColorScheme =
    appearance === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : appearance;
  const theme = useMemo<Theme>(
    () => ({ scheme, color: token => color(token, scheme, swap) }),
    [scheme, swap],
  );

  return (
    <ThemeContext.Provider value={theme}>
      <View
        className="flex-1"
        style={themeVariables[scheme][swap ? 'swapped' : 'normal']}
      >
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

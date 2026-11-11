import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme, View } from 'react-native';
import { vars } from 'nativewind';
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

const themeVariables = {
  light: vars(colorVariables('light')),
  dark: vars(colorVariables('dark')),
};

/** Expose les jetons du thème courant (clair/sombre via useColorScheme) à NativeWind. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme: ColorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const theme = useMemo<Theme>(
    () => ({ scheme, color: token => color(token, scheme) }),
    [scheme],
  );

  return (
    <ThemeContext.Provider value={theme}>
      <View className="flex-1" style={themeVariables[scheme]}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

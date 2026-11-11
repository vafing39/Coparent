import React, { useEffect, useMemo } from 'react';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  Theme,
} from '@react-navigation/native';
import { RestoringScreen } from '../screens/session/RestoringScreen';
import { UnreachableScreen } from '../screens/session/UnreachableScreen';
import { useSession } from '../stores/session';
import { useTheme } from '../theme/ThemeProvider';
import { AuthNavigator } from './AuthNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';

export function RootNavigator() {
  const { scheme, color } = useTheme();
  const status = useSession(state => state.status);
  const emailVerified = useSession(state => state.user?.emailVerified ?? false);
  const restore = useSession(state => state.restore);

  useEffect(() => {
    restore();
  }, [restore]);

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

  if (status === 'restoring') {
    return <RestoringScreen />;
  }
  if (status === 'unreachable') {
    return <UnreachableScreen />;
  }
  return (
    <NavigationContainer theme={navigationTheme}>
      {status !== 'signedIn' ? (
        <AuthNavigator />
      ) : (
        // PROVISOIRE : sans API famille, un utilisateur connecté reste dans la première
        // connexion. Plus tard : <AppNavigator /> quand sa famille existe.
        // La clé remonte le navigateur après la vérification, qui s'ouvre alors sur la famille.
        <OnboardingNavigator
          key={emailVerified ? 'famille' : 'verification'}
          emailVerified={emailVerified}
        />
      )}
    </NavigationContainer>
  );
}

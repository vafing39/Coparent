import React, { useEffect, useMemo } from 'react';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  Theme,
} from '@react-navigation/native';
import { RestoringScreen } from '../screens/session/RestoringScreen';
import { UnreachableScreen } from '../screens/session/UnreachableScreen';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../theme/ThemeProvider';
import { AuthNavigator } from './AuthNavigator';
import { SignedInNavigator } from './SignedInNavigator';

export function RootNavigator() {
  const { scheme, color } = useTheme();
  const { status, user, restore } = useAuth();
  const emailVerified = user?.emailVerified ?? false;

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
        <SignedInNavigator emailVerified={emailVerified} />
      )}
    </NavigationContainer>
  );
}

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
import { useInvitation } from '../hooks/useInvitation';
import { useTheme } from '../theme/ThemeProvider';
import { AuthNavigator } from './AuthNavigator';
import { SignedInNavigator } from './SignedInNavigator';

export function RootNavigator() {
  const { scheme, color } = useTheme();
  const { status, user, restore } = useAuth();
  const emailVerified = user?.emailVerified ?? false;
  const { isRestoringInvitation, pendingInvitation } = useInvitation();

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

  if (status === 'restoring' || isRestoringInvitation) {
    return <RestoringScreen />;
  }
  if (status === 'unreachable') {
    return <UnreachableScreen />;
  }
  return (
    <NavigationContainer theme={navigationTheme}>
      {status !== 'signedIn' ? (
        // Un nouveau lien d'invitation remonte le navigateur sur son aperçu.
        <AuthNavigator key={pendingInvitation?.token ?? 'sans-invitation'} />
      ) : (
        <SignedInNavigator emailVerified={emailVerified} />
      )}
    </NavigationContainer>
  );
}

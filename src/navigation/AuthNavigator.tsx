import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { BienvenueScreen } from '../screens/auth/BienvenueScreen';
import { ConnexionScreen } from '../screens/auth/ConnexionScreen';
import { InscriptionScreen } from '../screens/auth/InscriptionScreen';
import { PlaceholderScreen } from '../screens/auth/PlaceholderScreen';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

// À remplacer par le vrai écran lors de la fonction correspondante.
function MotDePasseScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t('forgotPassword.title')} />;
}

export function AuthNavigator() {
  const { color } = useTheme();
  const { t } = useTranslation();
  // Après « Modifier l'adresse », on revient directement sur l'inscription.
  const { authEntry } = useAuth();

  return (
    <Stack.Navigator
      initialRouteName={authEntry}
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal',
        // Libellé lu par VoiceOver/TalkBack sur la flèche de retour.
        headerBackTitle: t('common.back'),
        headerShadowVisible: false,
        headerStyle: { backgroundColor: color('background') },
        headerTintColor: color('text'),
        headerTitleStyle: { fontFamily: fonts.bold, color: color('text') },
        contentStyle: { backgroundColor: color('background') },
      }}
    >
      <Stack.Screen
        name="Bienvenue"
        component={BienvenueScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Inscription"
        component={InscriptionScreen}
        // Le titre est dans l'écran (maquette) : en-tête réduit à la flèche de retour.
        options={{ title: '' }}
      />
      <Stack.Screen
        name="ConnexionEmail"
        component={ConnexionScreen}
        // Le titre est dans l'écran (maquette) : en-tête réduit à la flèche de retour.
        options={{ title: '' }}
      />
      <Stack.Screen
        name="MotDePasse"
        component={MotDePasseScreen}
        options={{ title: t('forgotPassword.title') }}
      />
    </Stack.Navigator>
  );
}

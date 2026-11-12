import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { BienvenueScreen } from '../screens/auth/BienvenueScreen';
import { ConnexionScreen } from '../screens/auth/ConnexionScreen';
import { InscriptionScreen } from '../screens/auth/InscriptionScreen';
import { MotDePasseScreen } from '../screens/auth/MotDePasseScreen';
import { AccepterInvitationScreen } from '../screens/invitation/AccepterInvitationScreen';
import { useAuth } from '../hooks/useAuth';
import { useInvitation } from '../hooks/useInvitation';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  const { color } = useTheme();
  const { t } = useTranslation();
  // Après « Modifier l'adresse », on revient directement sur l'inscription.
  const { authEntry } = useAuth();
  // Invitation reçue par lien : on commence par son aperçu (sauf retour à l'inscription demandé).
  const { pendingInvitation } = useInvitation();
  const initialRoute =
    pendingInvitation && authEntry !== 'Inscription'
      ? 'AccepterInvitation'
      : authEntry;

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
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
        name="AccepterInvitation"
        component={AccepterInvitationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MotDePasse"
        component={MotDePasseScreen}
        // Le titre est dans l'écran (maquette) : en-tête réduit à la flèche de retour.
        options={{ title: '' }}
      />
    </Stack.Navigator>
  );
}

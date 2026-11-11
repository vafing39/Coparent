import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BienvenueScreen } from '../screens/auth/BienvenueScreen';
import { ConnexionScreen } from '../screens/auth/ConnexionScreen';
import { PlaceholderScreen } from '../screens/auth/PlaceholderScreen';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

// À remplacer par les vrais écrans lors des fonctions correspondantes.
const InscriptionScreen = () => (
  <PlaceholderScreen title="Créer un compte avec un email" />
);
const MotDePasseScreen = () => (
  <PlaceholderScreen title="Mot de passe oublié" />
);

export function AuthNavigator() {
  const { color } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal',
        // Libellé lu par VoiceOver/TalkBack sur la flèche de retour.
        headerBackTitle: 'Retour',
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
        options={{ title: 'Créer un compte' }}
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
        options={{ title: 'Mot de passe oublié' }}
      />
    </Stack.Navigator>
  );
}

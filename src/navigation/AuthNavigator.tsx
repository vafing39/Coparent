import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BienvenueScreen } from '../screens/auth/BienvenueScreen';
import { PlaceholderScreen } from '../screens/auth/PlaceholderScreen';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

// À remplacer par les vrais écrans lors des fonctions « Inscription » et « Connexion ».
const InscriptionScreen = () => (
  <PlaceholderScreen title="Créer un compte avec un email" />
);
const ConnexionEmailScreen = () => <PlaceholderScreen title="Connexion" />;

export function AuthNavigator() {
  const { color } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: color('background') },
        headerTintColor: color('primary'),
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
        component={ConnexionEmailScreen}
        options={{ title: 'Connexion' }}
      />
    </Stack.Navigator>
  );
}

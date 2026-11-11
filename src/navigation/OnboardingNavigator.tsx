import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import { OnboardingHeader } from '../components/OnboardingHeader';
import { PlaceholderScreen } from '../screens/auth/PlaceholderScreen';
import { FamilleScreen } from '../screens/onboarding/FamilleScreen';
import { VerificationScreen } from '../screens/onboarding/VerificationScreen';
import { useSession } from '../stores/session';
import type { OnboardingScreenProps, OnboardingStackParamList } from './types';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

// PROVISOIRE : étape 3 (enfants) à construire ; la déconnexion reste possible en attendant.
function EnfantsPlaceholderScreen({
  navigation,
}: OnboardingScreenProps<'Enfants'>) {
  const { t } = useTranslation();
  const signOut = useSession(state => state.signOut);
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <OnboardingHeader step={3} onBack={() => navigation.goBack()} />
      <PlaceholderScreen title={t('onboarding.children.title')} />
      <View className="px-6 pb-12">
        <Button
          label={t('common.signOut')}
          variant="secondary"
          onPress={() => signOut()}
        />
      </View>
    </SafeAreaView>
  );
}

/**
 * Première connexion (5 étapes). Démarre sur la vérification de l'email tant qu'elle
 * n'est pas faite, sinon sur la famille.
 */
export function OnboardingNavigator({
  emailVerified,
}: {
  emailVerified: boolean;
}) {
  return (
    <Stack.Navigator
      initialRouteName={emailVerified ? 'Famille' : 'Verification'}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Verification" component={VerificationScreen} />
      <Stack.Screen name="Famille" component={FamilleScreen} />
      <Stack.Screen name="Enfants" component={EnfantsPlaceholderScreen} />
    </Stack.Navigator>
  );
}

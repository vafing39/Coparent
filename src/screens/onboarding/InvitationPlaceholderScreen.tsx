import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { OnboardingHeader } from '../../components/OnboardingHeader';
import { PlaceholderScreen } from '../auth/PlaceholderScreen';
import { useAuth } from '../../hooks/useAuth';
import type { OnboardingScreenProps } from '../../navigation/types';

/** PROVISOIRE : étape 5 (invitation de l'autre parent) à construire ; la déconnexion reste possible en attendant. */
export function InvitationPlaceholderScreen({
  navigation,
}: OnboardingScreenProps<'Invitation'>) {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <OnboardingHeader step={5} onBack={() => navigation.goBack()} />
      <PlaceholderScreen title={t('onboarding.invitation.title')} />
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

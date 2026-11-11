import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { OnboardingHeader } from '../../components/OnboardingHeader';
import { PlaceholderScreen } from '../auth/PlaceholderScreen';
import { useSession } from '../../stores/session';
import type { OnboardingScreenProps } from '../../navigation/types';

/** PROVISOIRE : étape 4 (rythme de garde) à construire ; la déconnexion reste possible en attendant. */
export function RythmePlaceholderScreen({
  navigation,
}: OnboardingScreenProps<'Rythme'>) {
  const { t } = useTranslation();
  const signOut = useSession(state => state.signOut);
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <OnboardingHeader step={4} onBack={() => navigation.goBack()} />
      <PlaceholderScreen title={t('onboarding.schedule.title')} />
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

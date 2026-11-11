import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingHeader } from '../../components/OnboardingHeader';
import { RequireFamily } from '../../features/family/RequireFamily';
import { InvitationForm } from '../../features/invitation/InvitationForm';
import { useOnboardingDraft } from '../../hooks/useOnboardingDraft';
import type { OnboardingScreenProps } from '../../navigation/types';

/**
 * Étape 5 de la première connexion : invitation de l'autre parent, ou étape passée
 * (l'app fonctionne alors en solo). Dans les deux cas, on entre ensuite dans l'app.
 */
export function InvitationScreen({
  navigation,
}: OnboardingScreenProps<'Invitation'>) {
  const { finish } = useOnboardingDraft();
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <OnboardingHeader step={5} onBack={() => navigation.goBack()} />
      <RequireFamily onBack={() => navigation.goBack()}>
        {family => <InvitationForm family={family} onDone={finish} />}
      </RequireFamily>
    </SafeAreaView>
  );
}

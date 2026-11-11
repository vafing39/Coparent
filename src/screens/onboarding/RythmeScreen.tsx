import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingHeader } from '../../components/OnboardingHeader';
import { ScheduleForm } from '../../features/custody/ScheduleForm';
import { RequireFamily } from '../../features/family/RequireFamily';
import { useAuth } from '../../hooks/useAuth';
import { useOnboardingDraft } from '../../hooks/useOnboardingDraft';
import { DEFAULT_SCHEDULE, fromSchedule } from '../../schemas/custody';
import type { OnboardingScreenProps } from '../../navigation/types';

/**
 * Étape 4 de la première connexion : rythme de garde. « Continuer » garde le choix
 * (brouillon) et ouvre les vacances scolaires ; l'envoi se fait là-bas.
 */
export function RythmeScreen({ navigation }: OnboardingScreenProps<'Rythme'>) {
  const { user } = useAuth();
  const draft = useOnboardingDraft();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <OnboardingHeader step={4} onBack={() => navigation.goBack()} />
      <RequireFamily onBack={() => navigation.goBack()}>
        {family => (
          <ScheduleForm
            initial={
              draft.schedule ??
              (family.custodySchedule
                ? fromSchedule(family.custodySchedule, family.myRole).schedule
                : DEFAULT_SCHEDULE)
            }
            myRole={family.myRole}
            myName={
              family.members.find(member => member.role === family.myRole)
                ?.firstName ??
              user?.firstName ??
              ''
            }
            onContinue={schedule => {
              draft.setSchedule(schedule);
              navigation.navigate('Vacances');
            }}
          />
        )}
      </RequireFamily>
    </SafeAreaView>
  );
}

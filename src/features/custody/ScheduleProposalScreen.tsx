import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scheduleProposalErrorMessage } from '../../api/schedules';
import { LoadError } from '../../components/LoadError';
import { ChevronLeftIcon } from '../../components/icons';
import { useFamily } from '../../hooks/useFamily';
import { useResetOnUnmount } from '../../hooks/useResetOnUnmount';
import { useScheduleProposal } from '../../hooks/useScheduleProposal';
import type { AppScreenProps } from '../../navigation/types';
import { fromSchedule, ScheduleDraft } from '../../schemas/custody';
import { useTheme } from '../../theme/ThemeProvider';
import { HolidayRulesForm } from './HolidayRulesForm';
import { parentOf } from './parents';
import { ScheduleForm } from './ScheduleForm';
import { ScheduleProposalDetails } from './ScheduleProposalDetails';

/** Le rythme reçu, puis les deux étapes de la contre-proposition (rythme, vacances). */
type Step = 'details' | 'schedule' | 'holidays';

/**
 * Rythme proposé par l'autre parent, ouvert depuis « À traiter » (cahier des charges, 3).
 * « Valider ce rythme » l'applique ; « Proposer une modification » reprend les formulaires de
 * l'étape 4, pré-remplis, et envoie une nouvelle proposition à valider par l'autre parent.
 */
export function ScheduleProposalScreen({
  navigation,
  route,
}: AppScreenProps<'ScheduleProposal'>) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const { family } = useFamily();
  const { scheduleId } = route.params;
  const {
    openSchedule,
    closeSchedule,
    schedule,
    isLoadingSchedule,
    scheduleError,
    reloadSchedule,
    acceptSchedule,
    isAcceptingSchedule,
    acceptScheduleError,
    resetAcceptSchedule,
  } = useScheduleProposal();
  useResetOnUnmount(resetAcceptSchedule);
  const [step, setStep] = useState<Step>('details');
  const [draft, setDraft] = useState<ScheduleDraft | null>(null);

  useEffect(() => {
    openSchedule(scheduleId);
    return () => closeSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ouvrir une fois par rythme
  }, [scheduleId]);

  if (!family) {
    return null;
  }
  const saved = schedule ? fromSchedule(schedule, family.myRole) : null;

  const back = () => {
    if (step === 'holidays') {
      setStep('schedule');
    } else if (step === 'schedule') {
      setStep('details');
    } else {
      navigation.goBack();
    }
  };

  let title: string;
  let body: React.ReactNode;
  if (step === 'schedule' && saved) {
    title = t('scheduleProposal.modifyTitle');
    body = (
      <ScheduleForm
        initial={draft ?? saved.schedule}
        myRole={family.myRole}
        myName={parentOf(family, family.myRole).name}
        onContinue={next => {
          setDraft(next);
          setStep('holidays');
        }}
      />
    );
  } else if (step === 'holidays' && saved && draft) {
    title = t('onboarding.holidays.title');
    body = (
      <HolidayRulesForm
        family={family}
        schedule={draft}
        initial={saved.holidays}
        onSaved={() => navigation.goBack()}
      />
    );
  } else {
    title = t('scheduleProposal.title');
    let content: React.ReactNode;
    if (scheduleError && !schedule) {
      content = (
        <LoadError
          message={scheduleProposalErrorMessage(scheduleError)}
          onRetry={reloadSchedule}
        />
      );
    } else if (isLoadingSchedule || !schedule) {
      content = (
        <View
          accessible
          accessibilityLabel={t('common.loading')}
          className="h-[320px] rounded-[20px] bg-surface"
        />
      );
    } else {
      content = (
        <ScheduleProposalDetails
          schedule={schedule}
          family={family}
          isAccepting={isAcceptingSchedule}
          acceptError={acceptScheduleError}
          onAccept={() =>
            acceptSchedule(schedule.id, {
              onSuccess: () => navigation.goBack(),
            })
          }
          onModify={() => setStep('schedule')}
        />
      );
    }
    body = (
      <ScrollView contentContainerClassName="gap-4 px-4 pt-4 pb-8">
        {content}
      </ScrollView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-row items-center gap-1 border-b border-border pb-3 pl-2 pr-4 pt-6">
        <Pressable
          onPress={back}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          className="h-12 w-12 items-center justify-center rounded-full"
        >
          <ChevronLeftIcon color={color('text')} />
        </Pressable>
        <Text
          accessibilityRole="header"
          className="flex-1 font-extrabold text-[20px] leading-[26px] text-text"
        >
          {title}
        </Text>
      </View>
      {body}
    </SafeAreaView>
  );
}

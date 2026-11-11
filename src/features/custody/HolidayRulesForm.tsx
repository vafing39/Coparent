import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { ErrorText } from '../../components/ErrorText';
import { RadioCard } from '../../components/RadioCard';
import { scheduleErrorMessage } from '../../api/family';
import type { Family } from '../../api/types';
import { useFamily } from '../../hooks/useFamily';
import { useResetOnUnmount } from '../../hooks/useResetOnUnmount';
import { todayInParis } from '../../lib/dates';
import {
  HolidaysDraft,
  ScheduleDraft,
  SUMMER_SPLITS,
  toScheduleRequest,
} from '../../schemas/custody';

type Props = {
  family: Family;
  schedule: ScheduleDraft;
  initial: HolidaysDraft;
  /** Appelé une fois le rythme et les vacances enregistrés sur le serveur. */
  onSaved: () => void;
};

/**
 * Étape 4, vacances scolaires : partage des petites vacances et de l'été.
 * « Enregistrer » envoie le rythme et les vacances ensemble.
 */
export function HolidayRulesForm({
  family,
  schedule,
  initial,
  onSaved,
}: Props) {
  const { t } = useTranslation();
  const [holidays, setHolidays] = useState(initial);
  const {
    proposeSchedule,
    isProposingSchedule,
    proposeScheduleError,
    resetProposeSchedule,
  } = useFamily();
  useResetOnUnmount(resetProposeSchedule);

  const submit = () => {
    if (isProposingSchedule) {
      return;
    }
    proposeSchedule(
      toScheduleRequest(schedule, holidays, family.myRole, todayInParis()),
      { onSuccess: onSaved },
    );
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="grow px-6 pt-2 pb-8 gap-5"
    >
      <Text className="font-regular text-[15px] leading-[21px] text-text-secondary">
        {t('onboarding.holidays.intro', {
          zone: t(
            `onboarding.family.zone.options.${family.vacationZone}.label`,
          ),
        })}
      </Text>

      <View className="gap-3 rounded-2xl border-2 border-border bg-card p-4">
        <View className="gap-1">
          <Text
            accessibilityRole="header"
            className="font-bold text-[17px] text-text"
          >
            {t('onboarding.holidays.shortBreaks.title')}
          </Text>
          <Text className="font-regular text-[13px] text-text-secondary">
            {t('onboarding.holidays.shortBreaks.help')}
          </Text>
        </View>
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel={t('onboarding.holidays.shortBreaks.title')}
          className="gap-2"
        >
          <RadioCard
            label={t('onboarding.holidays.shortBreaks.evenYears')}
            checked={holidays.firstHalfEvenYearsMe}
            onPress={() =>
              setHolidays(h => ({ ...h, firstHalfEvenYearsMe: true }))
            }
          />
          <RadioCard
            label={t('onboarding.holidays.shortBreaks.oddYears')}
            checked={!holidays.firstHalfEvenYearsMe}
            onPress={() =>
              setHolidays(h => ({ ...h, firstHalfEvenYearsMe: false }))
            }
          />
        </View>
      </View>

      <View className="gap-3 rounded-2xl border-2 border-border bg-card p-4">
        <Text
          accessibilityRole="header"
          className="font-bold text-[17px] text-text"
        >
          {t('onboarding.holidays.summer.title')}
        </Text>
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel={t('onboarding.holidays.summer.title')}
          className="flex-row gap-1 rounded-full bg-background p-1"
        >
          {SUMMER_SPLITS.map(split => {
            const checked = holidays.summerSplit === split;
            return (
              <Pressable
                key={split}
                onPress={() => setHolidays(h => ({ ...h, summerSplit: split }))}
                accessibilityRole="radio"
                accessibilityState={{ checked }}
                className={`min-h-[44px] flex-1 items-center justify-center rounded-full ${
                  checked ? 'bg-primary' : ''
                }`}
              >
                <Text
                  className={`font-bold text-[13px] ${
                    checked ? 'text-on-primary' : 'text-text'
                  }`}
                >
                  {t(`onboarding.holidays.summer.${split}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text className="font-regular text-[13px] leading-[18px] text-text">
          {t(`onboarding.holidays.summer.${holidays.summerSplit}Help`)}
        </Text>
      </View>

      <View className="mt-auto gap-3 pt-2">
        {proposeScheduleError ? (
          <ErrorText text={scheduleErrorMessage(proposeScheduleError)} />
        ) : null}
        <Button
          label={t('onboarding.holidays.save')}
          onPress={submit}
          loading={isProposingSchedule}
        />
      </View>
    </ScrollView>
  );
}

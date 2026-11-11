import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { RadioCard } from '../../components/RadioCard';
import type { FamilyRole } from '../../api/types';
import {
  CUSTODY_PATTERNS,
  previewNights,
  ScheduleDraft,
  WEEKDAYS,
} from '../../schemas/custody';
import { CustodyPreview } from './CustodyPreview';
import { TimeField } from './TimeField';

type Props = {
  initial: ScheduleDraft;
  myRole: FamilyRole;
  myName: string;
  onContinue: (draft: ScheduleDraft) => void;
};

/** Étape 4 : rythme, aperçu, jour et heure de bascule, parent de départ. Rien n'est envoyé ici. */
export function ScheduleForm({ initial, myRole, myName, onContinue }: Props) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(initial);
  const custom = draft.pattern === 'CUSTOM';
  const update = (changes: Partial<ScheduleDraft>) =>
    setDraft(current => ({ ...current, ...changes }));

  const pickPattern = (pattern: ScheduleDraft['pattern']) =>
    setDraft(current => ({
      ...current,
      pattern,
      // En passant au personnalisé, on part de l'aperçu affiché.
      customNights:
        pattern === 'CUSTOM' && current.pattern !== 'CUSTOM'
          ? previewNights(current)
          : current.customNights,
    }));

  const toggleNight = (index: number) =>
    setDraft(current => ({
      ...current,
      customNights: current.customNights.map((night, i) =>
        i === index ? (night === 'me' ? 'other' : 'me') : night,
      ),
    }));

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="grow px-6 pt-6 pb-8 gap-5"
    >
      <Text
        accessibilityRole="header"
        className="font-extrabold text-[28px] leading-[34px] text-text"
      >
        {t('onboarding.schedule.title')}
      </Text>

      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={t('onboarding.schedule.patternLegend')}
        className="gap-2"
      >
        {CUSTODY_PATTERNS.map(pattern => (
          <RadioCard
            key={pattern}
            label={t(`onboarding.schedule.patterns.${pattern}.label`)}
            hint={t(`onboarding.schedule.patterns.${pattern}.hint`)}
            checked={draft.pattern === pattern}
            onPress={() => pickPattern(pattern)}
          />
        ))}
      </View>

      <CustodyPreview
        nights={previewNights(draft)}
        handoverWeekday={draft.handoverWeekday}
        myRole={myRole}
        myName={myName}
        onToggle={custom ? toggleNight : undefined}
      />

      <View className="gap-2">
        <Text className="font-bold text-[13px] text-text">
          {t('onboarding.schedule.handoverDay')}
        </Text>
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel={t('onboarding.schedule.handoverDay')}
          className="flex-row gap-1"
        >
          {WEEKDAYS.map(weekday => {
            const checked = draft.handoverWeekday === weekday;
            return (
              <Pressable
                key={weekday}
                onPress={() => update({ handoverWeekday: weekday })}
                accessibilityRole="radio"
                accessibilityState={{ checked }}
                accessibilityLabel={t(`weekdays.long.${weekday}`)}
                className={`min-h-[44px] flex-1 items-center justify-center rounded-md active:opacity-80 ${
                  checked
                    ? 'border-2 border-primary bg-primary-soft'
                    : 'border-[1.5px] border-border bg-surface'
                }`}
              >
                <Text className="font-bold text-[13px] text-text">
                  {t(`weekdays.short.${weekday}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <TimeField
        label={t('onboarding.schedule.handoverTime')}
        value={draft.handoverTime}
        onChange={handoverTime => update({ handoverTime })}
      />

      {/* Personnalisé : le parent de départ est celui de la première nuit de la grille. */}
      {custom ? null : (
        <View className="gap-2">
          <Text className="font-bold text-[13px] text-text">
            {t('onboarding.schedule.startLegend')}
          </Text>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel={t('onboarding.schedule.startLegend')}
            className="gap-2"
          >
            <RadioCard
              label={t('onboarding.schedule.startMe')}
              checked={draft.startsWithMe}
              onPress={() => update({ startsWithMe: true })}
            />
            <RadioCard
              label={t('onboarding.schedule.startOther')}
              checked={!draft.startsWithMe}
              onPress={() => update({ startsWithMe: false })}
            />
          </View>
        </View>
      )}

      <View className="mt-auto pt-2">
        <Button
          label={t('onboarding.schedule.continue')}
          onPress={() => onContinue(draft)}
        />
      </View>
    </ScrollView>
  );
}

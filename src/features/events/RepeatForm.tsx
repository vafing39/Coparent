import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import type {
  EventRepeat,
  Family,
  FamilyRole,
  RepeatEnd,
  RepeatPreviewDate,
} from '../../api/types';
import { CheckIcon, ChevronLeftIcon } from '../../components/icons';
import { useEvents } from '../../hooks/useEvents';
import { formatShortDate } from '../../lib/dates';
import { useTheme } from '../../theme/ThemeProvider';
import { ParentRing } from '../custody/ParentRing';
import { parentOf } from '../custody/parents';
import {
  childrenCount,
  childrenNames,
  FrequencyChoice,
  frequencyLabel,
} from './repeatText';

const FREQUENCIES: FrequencyChoice[] = [
  'NONE',
  'DAILY',
  'WEEKLY',
  'BIWEEKLY',
  'MONTHLY',
];
const ENDS: RepeatEnd[] = ['NEVER', 'SCHOOL_YEAR', 'COUNT'];
const ROLES: FamilyRole[] = ['PARENT_A', 'PARENT_B'];
const COUNT_MIN = 1;
const COUNT_MAX = 99;
const DEFAULT_COUNT = 10;

/** Le choix en cours : la fréquence (« Jamais » compris) et le reste de la règle. */
type Draft = {
  frequency: FrequencyChoice;
  onlyWith: FamilyRole | null;
  skipHolidays: boolean;
  end: RepeatEnd;
  count: number;
};

function toDraft(repeat: EventRepeat | null): Draft {
  return {
    frequency: repeat?.frequency ?? 'NONE',
    onlyWith: repeat?.onlyWith ?? null,
    // Exclusion des vacances activée par défaut (cahier des charges, 5)
    skipHolidays: repeat?.skipHolidays ?? true,
    end: repeat?.end ?? 'SCHOOL_YEAR',
    count: repeat?.count ?? DEFAULT_COUNT,
  };
}

function toRepeat(draft: Draft): EventRepeat | null {
  if (draft.frequency === 'NONE') {
    return null;
  }
  return {
    frequency: draft.frequency,
    onlyWith: draft.onlyWith,
    skipHolidays: draft.skipHolidays,
    end: draft.end,
    count: draft.end === 'COUNT' ? draft.count : null,
  };
}

type Props = {
  family: Family;
  initial: EventRepeat | null;
  /** Première séance « AAAA-MM-JJ ». */
  date: string;
  /** Sous le titre : « Judo · jeu. 19 nov., 17 h 00 ». */
  subtitle: string;
  childNames: string[];
  onCancel: () => void;
  onDone: (repeat: EventRepeat | null) => void;
};

/**
 * Sous-réglage « Répéter » du formulaire d'un événement (cahier des charges, 5) : fréquence,
 * « seulement quand … est chez », hors vacances scolaires, fin, et l'aperçu des prochaines dates
 * calculé par le serveur (garde et vacances). Retour : sans rien changer ; OK : la règle choisie.
 */
export function RepeatForm({
  family,
  initial,
  date,
  subtitle,
  childNames,
  onCancel,
  onDone,
}: Props) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const [draft, setDraft] = useState(() => toDraft(initial));
  const update = (changes: Partial<Draft>) =>
    setDraft(current => ({ ...current, ...changes }));
  const {
    previewRepeat,
    repeatPreview,
    isLoadingRepeatPreview,
    repeatPreviewError,
  } = useEvents();
  const repeat = toRepeat(draft);
  const repeatKey = JSON.stringify(repeat);
  const names = childrenNames(childNames);
  const count = childrenCount(childNames);

  useEffect(() => {
    previewRepeat(repeat ? { date, repeat } : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- la règle est comparée par sa valeur
  }, [date, repeatKey]);
  useEffect(() => () => previewRepeat(null), [previewRepeat]);

  // Toutes les deux semaines sans filtre : suivre plutôt la garde (cahier des charges, 5)
  const tipParent =
    draft.frequency === 'BIWEEKLY' && draft.onlyWith === null
      ? repeatPreview?.[0]?.parent ?? null
      : null;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-row items-center gap-1 pb-1 pl-2 pr-3 pt-6">
        <Pressable
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          className="h-12 w-12 items-center justify-center rounded-full"
        >
          <ChevronLeftIcon color={color('text')} />
        </Pressable>
        <View className="flex-1">
          <Text
            accessibilityRole="header"
            className="font-extrabold text-[22px] leading-[28px] text-text"
          >
            {t('events.repeat.title')}
          </Text>
          <Text
            numberOfLines={1}
            className="font-regular text-[13px] text-text-secondary"
          >
            {subtitle}
          </Text>
        </View>
        <Pressable
          onPress={() => onDone(repeat)}
          accessibilityRole="button"
          className="min-h-[44px] justify-center rounded-full bg-primary px-[18px]"
        >
          <Text className="font-extrabold text-[15px] text-on-primary">
            {t('events.repeat.ok')}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="gap-3 px-4 pt-2.5 pb-8">
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel={t('events.repeat.frequency')}
          className="rounded-[18px] border border-border bg-card px-3.5"
        >
          {FREQUENCIES.map((frequency, index) => {
            const checked = draft.frequency === frequency;
            return (
              <Pressable
                key={frequency}
                onPress={() => update({ frequency })}
                accessibilityRole="radio"
                accessibilityState={{ checked }}
                className={`min-h-[44px] flex-row items-center ${
                  index === 0 ? '' : 'border-t border-border'
                }`}
              >
                <Text
                  className={`flex-1 text-[15px] text-text ${
                    checked ? 'font-extrabold' : 'font-semibold'
                  }`}
                >
                  {frequencyLabel(frequency, date)}
                </Text>
                {checked ? (
                  <CheckIcon size={18} color={color('primary')} />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {tipParent ? (
          <View
            accessibilityRole="summary"
            className="gap-2 rounded-2xl bg-primary-soft px-3.5 py-3"
          >
            <Text className="font-regular text-[13px] leading-[18px] text-text">
              <Trans
                i18nKey="events.repeat.tip"
                count={count}
                values={{ names, name: parentOf(family, tipParent).name }}
                components={{ bold: <Text className="font-bold" /> }}
              />
            </Text>
            <Pressable
              onPress={() =>
                update({ frequency: 'WEEKLY', onlyWith: tipParent })
              }
              accessibilityRole="button"
              className="min-h-[40px] justify-center self-start rounded-full bg-primary px-3.5"
            >
              <Text className="font-extrabold text-[13px] text-on-primary">
                {t('events.repeat.useTip')}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {repeat ? (
          <View className="gap-3">
            <View className="gap-1.5">
              <Text className="font-bold text-[13px] text-text">
                {t('events.repeat.onlyWith', { count, names })}
              </Text>
              <View
                accessibilityRole="radiogroup"
                accessibilityLabel={t('events.repeat.onlyWith', {
                  count,
                  names,
                })}
                className="flex-row gap-1 rounded-full border border-border bg-card p-1"
              >
                {[null, ...ROLES].map(role => {
                  const checked = draft.onlyWith === role;
                  return (
                    <Pressable
                      key={role ?? 'anyone'}
                      onPress={() => update({ onlyWith: role })}
                      accessibilityRole="radio"
                      accessibilityState={{ checked }}
                      className={`min-h-[40px] flex-1 items-center justify-center rounded-full ${
                        checked ? 'bg-primary' : ''
                      }`}
                    >
                      <Text
                        numberOfLines={1}
                        className={`font-bold text-[13px] ${
                          checked ? 'text-on-primary' : 'text-text'
                        }`}
                      >
                        {role
                          ? parentOf(family, role).name
                          : t('events.repeat.anyone')}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="rounded-[18px] border border-border bg-card px-3.5">
              <Pressable
                onPress={() => update({ skipHolidays: !draft.skipHolidays })}
                accessibilityRole="switch"
                accessibilityState={{ checked: draft.skipHolidays }}
                accessibilityLabel={t('events.repeat.skipHolidays')}
                className="min-h-[52px] flex-row items-center gap-2.5"
              >
                <View className="flex-1">
                  <Text className="font-bold text-[15px] text-text">
                    {t('events.repeat.skipHolidays')}
                  </Text>
                  <Text className="font-regular text-[13px] text-text-secondary">
                    {t('events.repeat.skipHolidaysHint', {
                      zone: t(
                        `onboarding.family.zone.options.${family.vacationZone}.label`,
                      ),
                    })}
                  </Text>
                </View>
                <View
                  className={`h-7 w-12 justify-center rounded-full px-[3px] ${
                    draft.skipHolidays
                      ? 'items-end bg-primary'
                      : 'items-start bg-text-secondary'
                  }`}
                >
                  <View className="h-[22px] w-[22px] rounded-full bg-card" />
                </View>
              </Pressable>

              <View className="min-h-[52px] flex-row items-center gap-2 border-t border-border">
                <Text className="flex-1 font-bold text-[15px] text-text">
                  {t('events.repeat.end')}
                </Text>
                <View
                  accessibilityRole="radiogroup"
                  accessibilityLabel={t('events.repeat.end')}
                  className="flex-row gap-1 rounded-full bg-background p-[3px]"
                >
                  {ENDS.map(end => {
                    const checked = draft.end === end;
                    return (
                      <Pressable
                        key={end}
                        onPress={() => update({ end })}
                        accessibilityRole="radio"
                        accessibilityState={{ checked }}
                        className={`min-h-[36px] justify-center rounded-full px-2.5 ${
                          checked ? 'bg-primary' : ''
                        }`}
                      >
                        <Text
                          className={`font-bold text-[13px] ${
                            checked ? 'text-on-primary' : 'text-text'
                          }`}
                        >
                          {t(`events.repeat.ends.${end}`)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {draft.end === 'COUNT' ? (
                <View className="min-h-[52px] flex-row items-center gap-2.5 border-t border-border">
                  <Text className="flex-1 font-regular text-[15px] text-text">
                    {t('events.repeat.after')}
                  </Text>
                  <Stepper
                    label={t('events.repeat.lessSession')}
                    sign="−"
                    onPress={() =>
                      update({ count: Math.max(COUNT_MIN, draft.count - 1) })
                    }
                  />
                  <Text
                    accessibilityLiveRegion="polite"
                    className="min-w-[28px] text-center font-extrabold text-[17px] text-text"
                  >
                    {draft.count}
                  </Text>
                  <Stepper
                    label={t('events.repeat.moreSession')}
                    sign="+"
                    onPress={() =>
                      update({ count: Math.min(COUNT_MAX, draft.count + 1) })
                    }
                  />
                  <Text className="font-regular text-[15px] text-text">
                    {t('events.repeat.sessions')}
                  </Text>
                </View>
              ) : null}
            </View>

            <RepeatPreview
              family={family}
              dates={repeatPreview}
              isLoading={isLoadingRepeatPreview}
              failed={repeatPreviewError !== null}
            />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stepper({
  label,
  sign,
  onPress,
}: {
  label: string;
  sign: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-text-secondary bg-card"
    >
      <Text className="font-bold text-[20px] text-text">{sign}</Text>
    </Pressable>
  );
}

/** « Prochaines dates » : prévues, ou barrées (vacances, enfants chez l'autre parent). */
function RepeatPreview({
  family,
  dates,
  isLoading,
  failed,
}: {
  family: Family;
  dates: RepeatPreviewDate[] | undefined;
  isLoading: boolean;
  failed: boolean;
}) {
  const { t } = useTranslation();
  let body: React.ReactNode;
  if (failed) {
    body = (
      <Text className="mx-1 font-regular text-[13px] text-text-secondary">
        {t('events.repeat.previewFailed')}
      </Text>
    );
  } else if (isLoading || !dates) {
    body = (
      <View
        accessible
        accessibilityLabel={t('events.repeat.previewLoading')}
        className="h-16 rounded-2xl bg-surface"
      />
    );
  } else {
    const someSkipped = dates.some(item => item.skipped !== null);
    body = (
      <>
        <View className="flex-row flex-wrap gap-1.5">
          {dates.map(item => (
            <PreviewChip key={item.date} family={family} item={item} />
          ))}
        </View>
        <Text className="mx-1 font-regular text-[13px] text-text-secondary">
          {t(
            someSkipped
              ? 'events.repeat.someSkipped'
              : 'events.repeat.allPlanned',
          )}
        </Text>
      </>
    );
  }
  return (
    <View className="gap-1.5">
      <Text
        accessibilityRole="header"
        className="mx-1 font-bold text-[13px] text-text-secondary"
      >
        {t('events.repeat.preview')}
      </Text>
      {body}
    </View>
  );
}

function PreviewChip({
  family,
  item,
}: {
  family: Family;
  item: RepeatPreviewDate;
}) {
  const { t } = useTranslation();
  const date = formatShortDate(item.date);
  const parent = item.parent ? parentOf(family, item.parent) : null;
  let label: string;
  if (item.skipped === 'HOLIDAYS') {
    label = t('events.repeat.dateHolidays', { date });
  } else if (item.skipped === 'OTHER_PARENT') {
    label = t('events.repeat.dateOtherParent', { date, name: parent?.name });
  } else {
    label = parent
      ? t('events.repeat.datePlannedWith', { date, name: parent.name })
      : t('events.repeat.datePlanned', { date });
  }
  const skipped = item.skipped !== null;
  return (
    <View
      accessible
      accessibilityLabel={label}
      className={`flex-row items-center gap-1.5 rounded-full border border-border py-1.5 pl-1.5 pr-2.5 ${
        skipped ? 'bg-background' : 'bg-card'
      }`}
    >
      {item.parent && parent ? (
        <ParentRing role={item.parent} initial={parent.initial} size="xs" />
      ) : null}
      <Text
        className={`font-bold text-[13px] ${
          skipped ? 'text-text-secondary line-through' : 'text-text'
        }`}
      >
        {date}
      </Text>
    </View>
  );
}

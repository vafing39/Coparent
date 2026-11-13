import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import type {
  RepeatDay,
  RepeatMonthMode,
  RepeatUnit,
  Weekday,
} from '../../api/types';
import { ErrorText } from '../../components/ErrorText';
import { SwitchRow } from '../../components/SwitchRow';
import { formatTime } from '../../lib/dates';
import { TimeField } from '../custody/TimeField';
import { RepeatHeader, Stepper } from './repeatControls';
import {
  CustomRule,
  customLabel,
  isoDayOf,
  monthModeLabel,
  weekdayName,
  weekdayOf,
  WEEKDAYS,
} from './repeatText';

const UNITS: RepeatUnit[] = ['DAY', 'WEEK', 'MONTH'];
const MONTH_MODES: RepeatMonthMode[] = ['DAY_OF_MONTH', 'WEEKDAY_OF_MONTH'];
const INTERVAL_MIN = 1;
const INTERVAL_MAX = 12;

type Times = { start: string; end: string };

type Props = {
  initial: CustomRule | null;
  /** Première séance « AAAA-MM-JJ » : son jour est toujours choisi. */
  date: string;
  allDay: boolean;
  /** Horaire de l'événement « HH:mm » (celui du jour de l'événement). */
  startTime: string;
  endTime: string;
  onCancel: () => void;
  onDone: (rule: CustomRule) => void;
};

/**
 * « Personnalisé » (cahier des charges, 5) : tous les N jours, semaines ou mois ; par semaine,
 * les jours choisis (celui de l'événement toujours compris) et, s'ils diffèrent, leurs
 * horaires ; par mois, le même quantième ou le même rang du jour. Retour : sans rien changer.
 */
export function CustomRepeatForm({
  initial,
  date,
  allDay,
  startTime,
  endTime,
  onCancel,
  onDone,
}: Props) {
  const { t } = useTranslation();
  const eventDay = weekdayOf(date);
  const [interval, setEvery] = useState(initial?.interval ?? 1);
  const [unit, setUnit] = useState<RepeatUnit>(initial?.unit ?? 'WEEK');
  const [monthMode, setMonthMode] = useState<RepeatMonthMode>(
    initial?.monthMode ?? 'DAY_OF_MONTH',
  );
  const [days, setDays] = useState<Weekday[]>(() => {
    const chosen = initial?.days.map(day => day.dayOfWeek) ?? [];
    return chosen.includes(eventDay) ? chosen : [...chosen, eventDay];
  });
  const [sameTime, setSameTime] = useState(
    !initial?.days.some(day => day.startTime !== null),
  );
  const [times, setTimes] = useState<Partial<Record<Weekday, Times>>>(() =>
    Object.fromEntries(
      (initial?.days ?? [])
        .filter(day => day.startTime && day.endTime)
        .map(day => [
          day.dayOfWeek,
          {
            start: (day.startTime as string).slice(0, 5),
            end: (day.endTime as string).slice(0, 5),
          },
        ]),
    ),
  );
  const [timesError, setTimesError] = useState(false);

  const sortedDays = WEEKDAYS.filter(day => days.includes(day));
  const ownTimes = unit === 'WEEK' && !allDay && !sameTime && days.length > 1;
  const timesOf = (day: Weekday): Times =>
    day === eventDay
      ? { start: startTime, end: endTime }
      : times[day] ?? { start: startTime, end: endTime };

  const rule: CustomRule = {
    interval,
    unit,
    monthMode: unit === 'MONTH' ? monthMode : null,
    days:
      unit === 'WEEK'
        ? sortedDays.map(
            (day): RepeatDay =>
              ownTimes
                ? {
                    dayOfWeek: day,
                    startTime: timesOf(day).start,
                    endTime: timesOf(day).end,
                  }
                : { dayOfWeek: day, startTime: null, endTime: null },
          )
        : [],
  };

  const toggleDay = (day: Weekday) => {
    if (day === eventDay) {
      return;
    }
    setDays(current =>
      current.includes(day)
        ? current.filter(other => other !== day)
        : [...current, day],
    );
  };
  const setDayTime = (day: Weekday, changes: Partial<Times>) => {
    setTimesError(false);
    setTimes(current => ({
      ...current,
      [day]: { ...timesOf(day), ...changes },
    }));
  };
  const done = () => {
    if (
      ownTimes &&
      rule.days.some(day => (day.endTime ?? '') <= (day.startTime ?? ''))
    ) {
      setTimesError(true);
      return;
    }
    onDone(rule);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <RepeatHeader
        title={t('events.repeat.custom.title')}
        onCancel={onCancel}
        onDone={done}
      />
      <ScrollView contentContainerClassName="gap-4 px-4 pt-2 pb-8">
        <View className="gap-3.5 rounded-[20px] bg-card p-4">
          <Text
            accessibilityRole="header"
            className="font-extrabold text-[15px] text-text"
          >
            {t('events.repeat.custom.every.label')}
          </Text>
          <View className="flex-row items-center gap-3.5">
            <Stepper
              label={t('events.repeat.custom.less')}
              sign="−"
              onPress={() => setEvery(Math.max(INTERVAL_MIN, interval - 1))}
            />
            <Text
              accessibilityLiveRegion="polite"
              className="min-w-[40px] text-center font-extrabold text-[28px] text-text"
            >
              {interval}
            </Text>
            <Stepper
              label={t('events.repeat.custom.more')}
              sign="+"
              onPress={() => setEvery(Math.min(INTERVAL_MAX, interval + 1))}
            />
          </View>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel={t('events.repeat.custom.unit')}
            className="flex-row gap-1 rounded-full bg-background p-1"
          >
            {UNITS.map(option => {
              const checked = unit === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => setUnit(option)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked }}
                  className={`min-h-[40px] flex-1 items-center justify-center rounded-full ${
                    checked ? 'bg-primary' : ''
                  }`}
                >
                  <Text
                    className={`font-bold text-[13px] ${
                      checked ? 'text-on-primary' : 'text-text'
                    }`}
                  >
                    {t(`events.repeat.custom.units.${option}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {unit === 'WEEK' ? (
          <View className="gap-2">
            <Text className="font-bold text-[13px] text-text">
              {t('events.repeat.custom.days')}
            </Text>
            <View className="flex-row gap-1">
              {WEEKDAYS.map(day => {
                const checked = days.includes(day);
                const isEventDay = day === eventDay;
                return (
                  <Pressable
                    key={day}
                    onPress={() => toggleDay(day)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked, disabled: isEventDay }}
                    accessibilityLabel={
                      isEventDay
                        ? t('events.repeat.custom.eventDay', {
                            weekday: weekdayName(day),
                          })
                        : weekdayName(day)
                    }
                    className={`h-11 flex-1 items-center justify-center rounded-xl ${
                      checked
                        ? 'border-2 border-primary bg-primary'
                        : 'border-[1.5px] border-border bg-card'
                    }`}
                  >
                    <Text
                      className={`font-extrabold text-[13px] ${
                        checked ? 'text-on-primary' : 'text-text'
                      }`}
                    >
                      {t(`weekdays.initial.${isoDayOf(day)}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {days.length > 1 && !allDay ? (
              <View className="mt-3 rounded-[20px] bg-card px-4 py-1">
                <Text
                  accessibilityRole="header"
                  className="mb-0.5 mt-2.5 font-extrabold text-[15px] text-text"
                >
                  {t('events.repeat.custom.times')}
                </Text>
                <SwitchRow
                  label={t('events.repeat.custom.sameTime')}
                  value={sameTime}
                  onChange={value => {
                    setTimesError(false);
                    setSameTime(value);
                  }}
                />
                {sameTime
                  ? null
                  : sortedDays.map(day => (
                      <View
                        key={day}
                        className="gap-2 border-t border-border py-3"
                      >
                        <Text className="font-bold text-[15px] capitalize text-text">
                          {weekdayName(day)}
                        </Text>
                        {day === eventDay ? (
                          <Text className="font-regular text-[13px] text-text-secondary">
                            {t('events.repeat.custom.eventDayTime', {
                              start: formatTime(startTime),
                              end: formatTime(endTime),
                            })}
                          </Text>
                        ) : (
                          <View className="flex-row gap-2">
                            <View className="flex-1">
                              <TimeField
                                label={t('events.repeat.custom.start', {
                                  weekday: weekdayName(day),
                                })}
                                value={timesOf(day).start}
                                onChange={start => setDayTime(day, { start })}
                              />
                            </View>
                            <View className="flex-1">
                              <TimeField
                                label={t('events.repeat.custom.end', {
                                  weekday: weekdayName(day),
                                })}
                                value={timesOf(day).end}
                                onChange={end => setDayTime(day, { end })}
                              />
                            </View>
                          </View>
                        )}
                      </View>
                    ))}
                {timesError ? (
                  <View className="pb-3">
                    <ErrorText
                      text={t('events.repeat.custom.endBeforeStart')}
                    />
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}

        {unit === 'MONTH' ? (
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel={t('events.repeat.custom.monthDay')}
            className="gap-1.5"
          >
            {MONTH_MODES.map(mode => {
              const checked = monthMode === mode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => setMonthMode(mode)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked }}
                  className={`min-h-[50px] justify-center rounded-[14px] px-3.5 ${
                    checked
                      ? 'border-2 border-primary bg-primary-soft'
                      : 'border-[1.5px] border-border bg-card'
                  }`}
                >
                  <Text className="font-bold text-[15px] text-text">
                    {monthModeLabel(mode, date)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <Text
          accessibilityRole="summary"
          className="rounded-2xl bg-primary-soft px-4 py-3.5 font-regular text-[15px] leading-[21px] text-text"
        >
          <Trans
            i18nKey="events.repeat.custom.summary"
            values={{ summary: customLabel(rule, date) }}
            components={{ bold: <Text className="font-bold" /> }}
          />
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

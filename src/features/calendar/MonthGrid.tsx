import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Family } from '../../api/types';
import { LockIcon } from '../../components/icons';
import { useTheme } from '../../theme/ThemeProvider';
import { SOFT_BG } from '../custody/parentColors';
import { parentOf } from '../custody/parents';
import { CalendarDay, weekdayShort } from './calendarDays';
import { dayLabel } from './dayLabel';

type Props = {
  family: Family;
  /** Les 42 jours de la grille, lundi d'abord. */
  days: CalendarDay[];
  /** Le mois affiché (« AAAA-MM »), les autres jours sont estompés. */
  month: string;
  today: string;
  /** Jour choisi (« AAAA-MM-JJ »), affiché sous la grille, sinon null. */
  selected: string | null;
  onSelect: (date: string) => void;
};

/**
 * Vue mois : 6 semaines, chaque jour de la couleur du parent de la nuit, avec son initiale.
 * Un jour de passage est coupé en deux (avant, après) et marqué « J›C ». Les événements
 * sont signalés par une pastille violette (partagé) ou un cadenas (privé). Un jour du mois se
 * touche pour afficher son détail sous la grille.
 */
export function MonthGrid({
  family,
  days,
  month,
  today,
  selected,
  onSelect,
}: Props) {
  const weeks = Array.from({ length: days.length / 7 }, (_, i) =>
    days.slice(i * 7, i * 7 + 7),
  );
  return (
    <View className="gap-1">
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="flex-row gap-1"
      >
        {days.slice(0, 7).map(day => (
          <Text
            key={day.date}
            className="flex-1 text-center font-bold text-[11px] text-text-secondary"
          >
            {weekdayShort(day.date)}
          </Text>
        ))}
      </View>
      {weeks.map(week => (
        <View key={week[0].date} className="flex-row gap-1">
          {week.map(day => (
            <DayCell
              key={day.date}
              family={family}
              day={day}
              inMonth={day.date.startsWith(month)}
              today={today}
              selected={day.date === selected}
              onSelect={onSelect}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

function DayCell({
  family,
  day,
  inMonth,
  today,
  selected,
  onSelect,
}: {
  family: Family;
  day: CalendarDay;
  inMonth: boolean;
  today: string;
  selected: boolean;
  onSelect: (date: string) => void;
}) {
  const { t } = useTranslation();
  const isToday = day.date === today;
  const number = String(Number(day.date.slice(8, 10)));
  const outline = selected
    ? 'border-2 border-primary'
    : isToday
    ? 'border-2 border-text'
    : '';
  if (!inMonth) {
    return (
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="h-11 flex-1 items-center justify-center rounded-lg"
      >
        <Text className="font-semibold text-[15px] text-text-secondary">
          {number}
        </Text>
      </View>
    );
  }
  const pressable = {
    onPress: () => onSelect(day.date),
    accessibilityRole: 'button' as const,
    accessibilityState: { selected },
    accessibilityLabel: dayLabel(family, day, today),
    accessibilityHint: t('calendar.day.hint'),
  };
  if (!day.parent) {
    return (
      <Pressable
        {...pressable}
        className={`h-11 flex-1 items-center justify-center rounded-lg ${outline}`}
      >
        <Text className="font-semibold text-[15px] text-text-secondary">
          {number}
        </Text>
        <EventMarks day={day} />
      </Pressable>
    );
  }

  const handover = day.handover;
  const left = handover ? handover.from : day.parent;
  const initial = handover
    ? `${parentOf(family, handover.from).initial}›${
        parentOf(family, handover.to).initial
      }`
    : parentOf(family, day.parent).initial;

  return (
    <Pressable
      {...pressable}
      className={`h-11 flex-1 overflow-hidden rounded-lg ${SOFT_BG[left]} ${outline}`}
    >
      {handover ? (
        <View
          className={`absolute bottom-0 right-0 top-0 w-1/2 ${
            SOFT_BG[handover.to]
          }`}
        />
      ) : null}
      <View className="flex-1 items-center justify-center">
        <Text
          className={`text-[15px] leading-[18px] text-text ${
            isToday ? 'font-extrabold' : 'font-semibold'
          }`}
        >
          {number}
        </Text>
        <View className="flex-row items-center gap-[3px]">
          <Text className="font-extrabold text-[11px] leading-[13px] text-text">
            {initial}
          </Text>
          <EventMarks day={day} />
        </View>
      </View>
    </Pressable>
  );
}

/** Pastille violette s'il y a un événement partagé, cadenas s'il y a un événement privé. */
function EventMarks({ day }: { day: CalendarDay }) {
  const { color } = useTheme();
  const shared = day.events.some(event => event.visibility === 'SHARED');
  const secret = day.events.some(event => event.visibility === 'PRIVATE');
  return (
    <>
      {shared ? <View className="h-1.5 w-1.5 rounded-full bg-shared" /> : null}
      {secret ? (
        <LockIcon size={10} color={color('pending')} strokeWidth={3} />
      ) : null}
    </>
  );
}

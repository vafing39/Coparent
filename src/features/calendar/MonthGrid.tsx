import React from 'react';
import { Text, View } from 'react-native';
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
};

/**
 * Vue mois : 6 semaines, chaque jour de la couleur du parent de la nuit, avec son initiale.
 * Un jour de passage est coupé en deux (avant, après) et marqué « J›C ». Les événements
 * sont signalés par une pastille violette (partagé) ou un cadenas (privé).
 */
export function MonthGrid({ family, days, month, today }: Props) {
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
}: {
  family: Family;
  day: CalendarDay;
  inMonth: boolean;
  today: string;
}) {
  const isToday = day.date === today;
  const number = String(Number(day.date.slice(8, 10)));
  if (!inMonth || !day.parent) {
    return (
      <View
        accessible={inMonth}
        accessibilityLabel={inMonth ? dayLabel(family, day, today) : undefined}
        accessibilityElementsHidden={!inMonth}
        importantForAccessibility={inMonth ? 'yes' : 'no-hide-descendants'}
        className={`h-11 flex-1 items-center justify-center rounded-lg ${
          isToday ? 'border-2 border-text' : ''
        }`}
      >
        <Text className="font-semibold text-[15px] text-text-secondary">
          {number}
        </Text>
        {inMonth ? <EventMarks day={day} /> : null}
      </View>
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
    <View
      accessible
      accessibilityLabel={dayLabel(family, day, today)}
      className={`h-11 flex-1 overflow-hidden rounded-lg ${SOFT_BG[left]} ${
        isToday ? 'border-2 border-text' : ''
      }`}
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
    </View>
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

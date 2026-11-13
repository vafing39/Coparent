import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { CalendarEvent, Family } from '../../api/types';
import { LockIcon } from '../../components/icons';
import { formatTime, splitLocalDateTime } from '../../lib/dates';
import { useTheme } from '../../theme/ThemeProvider';
import { ParentRing } from '../custody/ParentRing';
import { SOFT_BG } from '../custody/parentColors';
import { parentOf } from '../custody/parents';
import { CalendarDay, weekdayShort } from './calendarDays';
import { dayLabel } from './dayLabel';
import { eventItemKey } from '../../api/events';
import { eventTime } from '../events/eventText';

type Props = {
  family: Family;
  /** Les 7 jours, du lundi au dimanche. */
  days: CalendarDay[];
  today: string;
  onOpenEvent: (event: CalendarEvent) => void;
};

/**
 * Vue semaine : un jour par ligne, chez qui sont les enfants, l'heure du passage et les
 * événements du jour (un appui ouvre leur détail).
 */
export function WeekList({ family, days, today, onOpenEvent }: Props) {
  return (
    <View className="gap-1.5">
      {days.map(day => (
        <DayRow
          key={day.date}
          family={family}
          day={day}
          today={today}
          onOpenEvent={onOpenEvent}
        />
      ))}
    </View>
  );
}

/**
 * Un jour : chez qui sont les enfants (ou le passage et son heure), vacances, échange, et ses
 * événements (un appui ouvre leur détail). Utilisé par la vue semaine et le jour choisi du mois.
 */
export function DayRow({
  family,
  day,
  today,
  onOpenEvent,
}: {
  family: Family;
  day: CalendarDay;
  today: string;
  onOpenEvent: (event: CalendarEvent) => void;
}) {
  const { t } = useTranslation();
  const handover = day.handover;
  let text = '';
  if (handover) {
    text = t('calendar.handoverDay', {
      from: parentOf(family, handover.from).name,
      to: parentOf(family, handover.to).name,
      time: formatTime(splitLocalDateTime(handover.at).time),
    });
  } else if (day.parent) {
    text = t('calendar.atParent', { name: parentOf(family, day.parent).name });
  }
  const background = handover
    ? 'bg-card border border-border'
    : day.parent
    ? SOFT_BG[day.parent]
    : 'bg-surface';

  return (
    <View className="flex-row items-stretch gap-2.5">
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className={`w-11 items-center justify-center rounded-xl ${
          day.date === today ? 'border-2 border-text' : ''
        }`}
      >
        <Text className="font-bold text-[11px] text-text-secondary">
          {weekdayShort(day.date)}
        </Text>
        <Text className="font-extrabold text-[17px] text-text">
          {Number(day.date.slice(8, 10))}
        </Text>
      </View>
      <View
        className={`min-h-[56px] flex-1 justify-center gap-0.5 rounded-xl px-3 py-2 ${background}`}
      >
        <View
          accessible
          // Le jour et la garde ; les événements sont lus un par un, en dessous.
          accessibilityLabel={dayLabel(family, { ...day, events: [] }, today)}
          className="gap-0.5"
        >
          <View className="flex-row items-center gap-1.5">
            {handover ? (
              <View className="flex-row">
                <ParentRing
                  role={handover.from}
                  initial={parentOf(family, handover.from).initial}
                  size="xs"
                />
                <View className="-ml-1.5">
                  <ParentRing
                    role={handover.to}
                    initial={parentOf(family, handover.to).initial}
                    size="xs"
                  />
                </View>
              </View>
            ) : day.parent ? (
              <ParentRing
                role={day.parent}
                initial={parentOf(family, day.parent).initial}
                size="xs"
              />
            ) : null}
            <Text className="flex-1 font-bold text-[13px] text-text">
              {text}
            </Text>
          </View>
          {day.holiday ? (
            <Text className="font-regular text-[13px] text-text-secondary">
              {day.holiday}
            </Text>
          ) : null}
          {day.exchange ? (
            <Text className="font-semibold text-[13px] text-text-secondary">
              {t('calendar.exchangeTag')}
            </Text>
          ) : null}
        </View>
        {day.events.map(event => (
          <EventLine
            key={eventItemKey(event)}
            event={event}
            onPress={() => onOpenEvent(event)}
          />
        ))}
      </View>
    </View>
  );
}

/** Un événement du jour : pastille (partagé) ou cadenas (privé), heure et titre. */
function EventLine({
  event,
  onPress,
}: {
  event: CalendarEvent;
  onPress: () => void;
}) {
  const { color } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="min-h-[32px] flex-row items-center gap-1.5 active:opacity-70"
    >
      {event.visibility === 'SHARED' ? (
        <View className="h-2 w-2 rounded-full bg-shared" />
      ) : (
        <LockIcon size={12} color={color('pending')} />
      )}
      <Text className="flex-1 font-regular text-[13px] text-text">
        {`${eventTime(event)} · ${event.title}`}
      </Text>
    </Pressable>
  );
}

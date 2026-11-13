import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { CalendarEvent } from '../../api/types';
import { LockIcon } from '../../components/icons';
import { useCalendar } from '../../hooks/useCalendar';
import { formatTime } from '../../lib/dates';
import { joinNames } from '../../lib/text';
import { useTheme } from '../../theme/ThemeProvider';
import { EmptyCard, HomeCard } from './HomeCard';

/**
 * « Aujourd'hui » : les événements du jour (chargés par CalendarProvider avec ceux des deux
 * prochains mois). Un appui ouvre le détail de l'événement.
 */
export function TodayCard({
  onOpenEvent,
}: {
  onOpenEvent: (event: CalendarEvent) => void;
}) {
  const { t } = useTranslation();
  const { today, upcomingEvents } = useCalendar();
  const events = (upcomingEvents ?? []).filter(event => event.date === today);

  if (events.length === 0) {
    return (
      <EmptyCard title={t('home.today.title')} text={t('home.today.empty')} />
    );
  }
  return (
    <HomeCard title={t('home.today.title')}>
      <View>
        {events.map((event, index) => (
          <TodayRow
            key={event.id}
            event={event}
            divider={index > 0}
            onPress={() => onOpenEvent(event)}
          />
        ))}
      </View>
    </HomeCard>
  );
}

function TodayRow({
  event,
  divider,
  onPress,
}: {
  event: CalendarEvent;
  divider: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const shared = event.visibility === 'SHARED';
  const time =
    event.allDay || !event.startTime
      ? t('home.today.allDay')
      : formatTime(event.startTime.slice(0, 5));
  const meta = [
    joinNames(event.children.map(child => child.firstName)),
    event.location,
    t(shared ? 'events.visibility.SHARED' : 'events.visibility.PRIVATE'),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={`min-h-[52px] flex-row items-center gap-3 py-2 active:opacity-70 ${
        divider ? 'border-t border-border' : ''
      }`}
    >
      <Text className="w-14 font-bold text-[13px] text-text">{time}</Text>
      <View className="flex-1">
        <Text className="font-bold text-[15px] text-text">{event.title}</Text>
        <Text className="font-regular text-[13px] text-text-secondary">
          {meta}
        </Text>
      </View>
      {shared ? (
        <View className="h-2 w-2 rounded-full bg-shared" />
      ) : (
        <LockIcon size={14} color={color('pending')} />
      )}
    </Pressable>
  );
}

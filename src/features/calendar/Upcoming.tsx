import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { CalendarEvent, Family, Handover } from '../../api/types';
import { LockIcon } from '../../components/icons';
import {
  formatShortDate,
  formatTime,
  splitLocalDateTime,
} from '../../lib/dates';
import { joinNames } from '../../lib/text';
import { useTheme } from '../../theme/ThemeProvider';
import { ParentRing } from '../custody/ParentRing';
import { parentOf } from '../custody/parents';
import { eventItemKey } from '../../api/events';
import { eventSortKey, eventTime } from '../events/eventText';

/** Un élément à venir : un passage de garde ou un événement, avec sa clé de tri « AAAA-MM-JJTHH:mm ». */
export type UpcomingItem =
  | { kind: 'handover'; key: string; handover: Handover }
  | { kind: 'event'; key: string; event: CalendarEvent };

/** Passages et événements mêlés, triés par date, les `count` premiers. */
export function upcomingItems(
  handovers: Handover[],
  events: CalendarEvent[],
  count: number,
): UpcomingItem[] {
  const items: UpcomingItem[] = [
    ...handovers.map(handover => ({
      kind: 'handover' as const,
      key: handover.at.slice(0, 16),
      handover,
    })),
    ...events.map(event => ({
      kind: 'event' as const,
      key: eventSortKey(event),
      event,
    })),
  ];
  // Même format partout : l'ordre du texte est l'ordre chronologique.
  return items
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
    .slice(0, count);
}

/** « À venir » : les prochains passages de garde et événements, quelle que soit la période affichée. */
export function Upcoming({
  family,
  items,
  onOpenEvent,
}: {
  family: Family;
  items: UpcomingItem[];
  onOpenEvent: (event: CalendarEvent) => void;
}) {
  const { t } = useTranslation();
  return (
    <View className="gap-1.5">
      <Text
        accessibilityRole="header"
        className="mx-1 font-bold text-[13px] text-text-secondary"
      >
        {t('calendar.upcoming.title')}
      </Text>
      <View className="rounded-[20px] border border-border bg-card px-4 py-1.5">
        {items.length === 0 ? (
          <Text className="py-3 font-regular text-[15px] leading-[21px] text-text-secondary">
            {t('calendar.upcoming.none')}
          </Text>
        ) : null}
        {items.map((item, index) =>
          item.kind === 'handover' ? (
            <HandoverRow
              key={item.key}
              family={family}
              handover={item.handover}
              divider={index > 0}
            />
          ) : (
            <EventRow
              key={eventItemKey(item.event)}
              event={item.event}
              divider={index > 0}
              onPress={() => onOpenEvent(item.event)}
            />
          ),
        )}
      </View>
    </View>
  );
}

function HandoverRow({
  family,
  handover,
  divider,
}: {
  family: Family;
  handover: Handover;
  divider: boolean;
}) {
  const { t } = useTranslation();
  const from = parentOf(family, handover.from);
  const to = parentOf(family, handover.to);
  const { date, time } = splitLocalDateTime(handover.at);
  return (
    <View
      accessible
      className={`min-h-[52px] flex-row items-center gap-3 py-2 ${
        divider ? 'border-t border-border' : ''
      }`}
    >
      <View className="w-[34px] flex-row">
        <ParentRing role={handover.from} initial={from.initial} size="xs" />
        <View className="-ml-1.5">
          <ParentRing role={handover.to} initial={to.initial} size="xs" />
        </View>
      </View>
      <View className="flex-1">
        <Text className="font-bold text-[15px] text-text">
          {t('calendar.upcoming.item', { from: from.name, to: to.name })}
        </Text>
        <Text className="font-regular text-[13px] text-text-secondary">
          {`${formatShortDate(date)} · ${formatTime(time)}`}
        </Text>
      </View>
    </View>
  );
}

function EventRow({
  event,
  divider,
  onPress,
}: {
  event: CalendarEvent;
  divider: boolean;
  onPress: () => void;
}) {
  const { color } = useTheme();
  const shared = event.visibility === 'SHARED';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={`min-h-[52px] flex-row items-center gap-3 py-2 active:opacity-70 ${
        divider ? 'border-t border-border' : ''
      }`}
    >
      <View className="w-[34px] items-center">
        <View className="h-[34px] w-[34px] items-center justify-center rounded-full bg-surface">
          {shared ? (
            <View className="h-2.5 w-2.5 rounded-full bg-shared" />
          ) : (
            <LockIcon size={16} color={color('pending')} />
          )}
        </View>
      </View>
      <View className="flex-1">
        <Text className="font-bold text-[15px] text-text">{event.title}</Text>
        <Text className="font-regular text-[13px] text-text-secondary">
          {[
            formatShortDate(event.date),
            eventTime(event),
            joinNames(event.children.map(child => child.firstName)),
          ].join(' · ')}
        </Text>
      </View>
    </Pressable>
  );
}

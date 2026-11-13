import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { CalendarEvent, Family } from '../../api/types';
import { useCustody } from '../../hooks/useCustody';
import { formatTime, splitLocalDateTime } from '../../lib/dates';
import { ParentRing } from '../custody/ParentRing';
import { parentOf } from '../custody/parents';
import { childrenCount, childrenNames } from './repeatText';

/**
 * « Ce jour-là » du détail d'un événement : chez qui sont les enfants ce jour-là (la nuit qui
 * commence), ou le passage de garde et son heure. Rien sans rythme ni pendant le chargement.
 */
export function EventDayCustody({
  family,
  event,
}: {
  family: Family;
  event: CalendarEvent;
}) {
  const { t } = useTranslation();
  const { openDayCustody, closeDayCustody, dayCustody } = useCustody();

  useEffect(() => {
    openDayCustody(event.date);
    return closeDayCustody;
  }, [event.date, openDayCustody, closeDayCustody]);

  const night = dayCustody?.nights.find(item => item.date === event.date);
  if (!night) {
    return null;
  }
  const handover = dayCustody?.handovers.find(item =>
    item.at.startsWith(event.date),
  );
  const names = event.children.map(child => child.firstName);
  const text = handover
    ? t('events.custodyDay.handover', {
        from: parentOf(family, handover.from).name,
        to: parentOf(family, handover.to).name,
        time: formatTime(splitLocalDateTime(handover.at).time),
      })
    : t('events.custodyDay.at', {
        count: childrenCount(names),
        names: childrenNames(names),
        name: parentOf(family, night.parent).name,
      });
  const ring = handover ? handover.from : night.parent;

  return (
    <View
      accessible
      className="min-h-[56px] flex-row items-center gap-3 border-t border-border py-2"
    >
      <ParentRing
        role={ring}
        initial={parentOf(family, ring).initial}
        size="sm"
      />
      <View className="flex-1">
        <Text className="font-regular text-[13px] text-text-secondary">
          {t('events.custodyDay.label')}
        </Text>
        <Text className="font-bold text-[15px] text-text">{text}</Text>
      </View>
    </View>
  );
}

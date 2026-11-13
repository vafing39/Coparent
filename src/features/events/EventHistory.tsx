import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import type { EventChange } from '../../api/types';
import { useEvents } from '../../hooks/useEvents';
import {
  formatDayMonth,
  formatInstantTime,
  formatShortDate,
} from '../../lib/dates';
import { joinNames } from '../../lib/text';

/**
 * « Julien a modifié l'heure et le lieu », « Vous avez supprimé la séance du jeu. 3 déc. » :
 * une ligne de l'historique, puis les séances concernées d'une modification.
 */
export function changeText(change: EventChange): {
  text: string;
  scope: string | null;
} {
  const context = change.mine ? 'mine' : 'other';
  const name = change.authorFirstName ?? i18n.t('events.history.someone');
  const date = change.occurrenceDate
    ? formatShortDate(change.occurrenceDate)
    : '';
  switch (change.action) {
    case 'CREATED':
      return {
        text: i18n.t('events.history.created', { context, name }),
        scope: null,
      };
    case 'DELETED':
      return {
        text: i18n.t('events.history.deleted', {
          context,
          name,
          what: change.scope
            ? i18n.t(`events.history.deletedWhat.${change.scope}`, { date })
            : i18n.t('events.history.deletedWhat.event'),
        }),
        scope: null,
      };
    case 'UPDATED':
      return {
        text: i18n.t('events.history.updated', {
          context,
          name,
          fields: joinNames(
            change.fields.map(field =>
              i18n.t(`events.history.fields.${field}`),
            ),
          ),
        }),
        scope: change.scope
          ? i18n.t(`events.history.updatedScope.${change.scope}`, { date })
          : null,
      };
  }
}

/**
 * Historique des modifications d'un événement et de sa série (cahier des charges, 5), visible
 * par les parents qui voient l'événement. Chargé à l'ouverture du détail.
 */
export function EventHistory({ eventId }: { eventId: string }) {
  const { t } = useTranslation();
  const { openHistory, closeHistory, history, isLoadingHistory, historyError } =
    useEvents();

  useEffect(() => {
    openHistory(eventId);
    return closeHistory;
  }, [eventId, openHistory, closeHistory]);

  let body: React.ReactNode;
  if (historyError) {
    body = (
      <Text className="py-3 font-regular text-[13px] text-text-secondary">
        {t('events.history.failed')}
      </Text>
    );
  } else if (isLoadingHistory || !history) {
    body = (
      <View
        accessible
        accessibilityLabel={t('events.history.loading')}
        className="my-3 h-12 rounded-xl bg-surface"
      />
    );
  } else {
    body = history.map((change, index) => {
      const { text, scope } = changeText(change);
      const when = t('events.history.when', {
        day: formatDayMonth(change.createdAt),
        time: formatInstantTime(change.createdAt),
      });
      return (
        <View
          key={change.id}
          accessible
          className={`gap-0.5 py-3 ${
            index === 0 ? '' : 'border-t border-border'
          }`}
        >
          <Text className="font-bold text-[15px] leading-[21px] text-text">
            {text}
          </Text>
          <Text className="font-regular text-[13px] text-text-secondary">
            {scope ? `${scope} · ${when}` : when}
          </Text>
        </View>
      );
    });
  }

  return (
    <View className="gap-1.5">
      <Text
        accessibilityRole="header"
        className="mx-1 font-bold text-[13px] text-text-secondary"
      >
        {t('events.history.title')}
      </Text>
      <View className="rounded-[20px] border border-border bg-card px-4">
        {body}
      </View>
    </View>
  );
}

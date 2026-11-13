import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { eventErrorMessage } from '../../api/events';
import type { EventScope } from '../../api/types';
import { ErrorText } from '../../components/ErrorText';
import { ChevronLeftIcon, LockIcon } from '../../components/icons';
import { useEvents } from '../../hooks/useEvents';
import { useFamily } from '../../hooks/useFamily';
import { useResetOnUnmount } from '../../hooks/useResetOnUnmount';
import { formatDayMonth, formatLongDate, todayInParis } from '../../lib/dates';
import { joinNames } from '../../lib/text';
import type { AppScreenProps } from '../../navigation/types';
import { useTheme } from '../../theme/ThemeProvider';
import { EventHistory } from './EventHistory';
import { eventTime } from './eventText';
import { repeatSummary } from './repeatText';
import { ScopeSheet } from './ScopeSheet';

/**
 * Détail d'un événement. Un événement visible peut toujours être modifié et supprimé : un
 * événement partagé par les deux parents, un événement privé par son auteur, le seul à le voir.
 * Pour une séance d'une série, la règle est résumée, et « Modifier » ou « Supprimer » demande
 * d'abord quelles séances (ScopeSheet). En bas, l'historique des modifications (EventHistory).
 */
export function EventDetailScreen({
  navigation,
  route,
}: AppScreenProps<'EventDetail'>) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const { event } = route.params;
  const { family } = useFamily();
  const { deleteEvent, isDeletingEvent, deleteEventError, resetDeleteEvent } =
    useEvents();
  useResetOnUnmount(resetDeleteEvent);
  const [scopeAction, setScopeAction] = useState<'edit' | 'delete' | null>(
    null,
  );
  const shared = event.visibility === 'SHARED';
  const date = formatLongDate(event.date);
  const series = event.repeat;

  const edit = () => {
    if (series) {
      setScopeAction('edit');
    } else {
      navigation.navigate('EventForm', { event });
    }
  };
  const onScope = (scope: EventScope) => {
    const action = scopeAction;
    setScopeAction(null);
    if (action === 'edit') {
      navigation.navigate('EventForm', { event, scope });
    } else {
      deleteEvent(
        { id: event.id, scope, date: event.date },
        { onSuccess: () => navigation.goBack() },
      );
    }
  };

  const confirmDelete = () => {
    if (series) {
      setScopeAction('delete');
      return;
    }
    Alert.alert(
      t('events.deleteConfirm', { title: event.title }),
      t('events.deleteBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('events.deleteAction'),
          style: 'destructive',
          onPress: () =>
            deleteEvent(
              { id: event.id },
              { onSuccess: () => navigation.goBack() },
            ),
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-row items-center gap-1 pb-1 pl-2 pr-4 pt-6">
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          className="h-12 w-12 items-center justify-center rounded-full"
        >
          <ChevronLeftIcon color={color('text')} />
        </Pressable>
        <View className="flex-1" />
        <Pressable
          onPress={edit}
          accessibilityRole="button"
          className="min-h-[44px] justify-center rounded-full border-[1.5px] border-text-secondary px-3.5"
        >
          <Text className="font-bold text-[15px] text-text">
            {t('events.edit')}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="grow gap-3.5 px-4 pt-2 pb-6">
        <View className="gap-2 px-1">
          <View className="flex-row items-center gap-1.5 self-start rounded-full bg-card px-2.5 py-1">
            {shared ? (
              <View className="h-2 w-2 rounded-full bg-shared" />
            ) : (
              <LockIcon size={12} color={color('pending')} />
            )}
            <Text className="font-bold text-[13px] text-text">
              {t('events.badge', {
                type: t(`events.type.${event.type}`),
                visibility: t(
                  shared ? 'events.sharedLower' : 'events.privateLower',
                ),
              })}
            </Text>
          </View>
          <Text
            accessibilityRole="header"
            className="font-extrabold text-[26px] leading-[32px] text-text"
          >
            {event.title}
          </Text>
          <Text className="font-regular text-[15px] text-text">
            {t('events.when', { date, time: eventTime(event) })}
          </Text>
          {series && family ? (
            <Text className="font-regular text-[13px] leading-[18px] text-text-secondary">
              {repeatSummary(
                series,
                series.firstDate,
                family,
                event.children.map(child => child.firstName),
              )}
            </Text>
          ) : null}
        </View>

        <View className="rounded-[20px] border border-border bg-card px-4">
          <DetailRow
            label={t('events.children.label', {
              count: event.children.length,
            })}
            value={joinNames(event.children.map(child => child.firstName))}
          />
          {event.location ? (
            <DetailRow
              label={t('events.location.label')}
              value={event.location}
              divider
            />
          ) : null}
          <DetailRow
            label={t('events.reminder.label')}
            value={t(`events.reminder.${event.reminder}`)}
            divider
          />
        </View>

        <Text className="mx-1 font-regular text-[13px] leading-[18px] text-text-secondary">
          {event.authorFirstName
            ? t('events.addedBy', {
                name: event.mine ? t('events.you') : event.authorFirstName,
                date: formatDayMonth(event.createdAt),
              })
            : t('events.addedByUnknown', {
                date: formatDayMonth(event.createdAt),
              })}
        </Text>

        <EventHistory eventId={event.id} />

        <View className="mt-auto gap-2">
          {deleteEventError ? (
            <ErrorText text={eventErrorMessage(deleteEventError)} />
          ) : null}
          <Pressable
            onPress={confirmDelete}
            disabled={isDeletingEvent}
            accessibilityRole="button"
            accessibilityState={{
              disabled: isDeletingEvent,
              busy: isDeletingEvent,
            }}
            className="min-h-[48px] items-center justify-center"
          >
            <Text className="font-bold text-[15px] text-error">
              {t('events.delete')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
      <ScopeSheet
        action={scopeAction}
        date={event.date}
        past={event.date < todayInParis()}
        onClose={() => setScopeAction(null)}
        onConfirm={onScope}
      />
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
  divider = false,
}: {
  label: string;
  value: string;
  divider?: boolean;
}) {
  return (
    <View
      accessible
      className={`min-h-[56px] justify-center py-2 ${
        divider ? 'border-t border-border' : ''
      }`}
    >
      <Text className="font-regular text-[13px] text-text-secondary">
        {label}
      </Text>
      <Text className="font-bold text-[15px] text-text">{value}</Text>
    </View>
  );
}

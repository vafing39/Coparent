import React, { useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError } from '../../api/errors';
import type { CalendarEvent, FamilyRole } from '../../api/types';
import { LoadError } from '../../components/LoadError';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from '../../components/icons';
import { CalendarLegend } from '../../features/calendar/CalendarLegend';
import { MonthGrid } from '../../features/calendar/MonthGrid';
import { Upcoming, upcomingItems } from '../../features/calendar/Upcoming';
import { WeekList } from '../../features/calendar/WeekList';
import {
  buildDays,
  monthTitle,
  nowInParis,
  upcomingHandovers,
  weekTitle,
} from '../../features/calendar/calendarDays';
import { parentOf } from '../../features/custody/parents';
import { useCalendar } from '../../hooks/useCalendar';
import { useFamily } from '../../hooks/useFamily';
import type { TabScreenProps } from '../../navigation/types';
import { useTheme } from '../../theme/ThemeProvider';

/** Nombre d'éléments listés dans « À venir ». */
const UPCOMING_COUNT = 5;

/** Événement pas encore terminé : un jour à venir, ou aujourd'hui avant son heure de fin. */
function notOver(event: CalendarEvent, now: string): boolean {
  const today = now.slice(0, 10);
  if (event.date !== today) {
    return event.date > today;
  }
  return event.allDay || (event.endTime ?? '').slice(0, 5) > now.slice(11);
}

/**
 * Onglet Calendrier : la garde calculée par le backend, en vue mois ou semaine (cahier des
 * charges, 4), et les événements (5). Une couleur par parent, toujours avec l'initiale ; les
 * jours de passage sont coupés en deux ; un événement partagé est marqué d'une pastille
 * violette, un événement privé d'un cadenas.
 */
export function CalendrierScreen({ navigation }: TabScreenProps<'Calendrier'>) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const { family } = useFamily();
  const {
    today,
    view,
    anchor,
    dates,
    showMonth,
    showWeek,
    showPrevious,
    showNext,
    periodCustody,
    periodError,
    upcomingCustody,
    periodEvents,
    upcomingEvents,
    eventsError,
    reloadCalendar,
  } = useCalendar();
  const [refreshing, setRefreshing] = useState(false);

  if (!family) {
    // Les onglets ne s'ouvrent qu'une fois la famille créée (SignedInNavigator).
    return null;
  }
  const isMonth = view === 'month';
  const otherRole: FamilyRole =
    family.myRole === 'PARENT_A' ? 'PARENT_B' : 'PARENT_A';

  const openEvent = (event: CalendarEvent) =>
    navigation.navigate('EventDetail', { event });

  const refresh = () => {
    setRefreshing(true);
    reloadCalendar().finally(() => setRefreshing(false));
  };

  let body: React.ReactNode;
  if (periodError && !periodCustody) {
    body =
      periodError instanceof ApiError && periodError.status === 404 ? (
        <View className="rounded-[20px] border border-border bg-card p-[18px]">
          <Text className="font-regular text-[15px] leading-[21px] text-text-secondary">
            {t('calendar.noSchedule')}
          </Text>
        </View>
      ) : (
        <LoadError message={t('calendar.loadFailed')} onRetry={refresh} />
      );
  } else if (!periodCustody) {
    body = (
      <View
        accessible
        accessibilityLabel={t('common.loading')}
        className="gap-3"
      >
        <View className="h-[290px] rounded-[20px] bg-surface" />
        <View className="h-[120px] rounded-[20px] bg-surface" />
      </View>
    );
  } else {
    const days = buildDays(periodCustody, dates, periodEvents);
    const now = nowInParis();
    const proposed = family.solo || periodCustody.scheduleStatus !== 'ACTIVE';
    body = (
      <>
        {proposed ? (
          <Text className="mx-1 font-regular text-[13px] leading-[18px] text-text-secondary">
            {family.solo
              ? t('calendar.proposedSolo', {
                  name: parentOf(family, otherRole).name,
                })
              : t('calendar.proposed')}
          </Text>
        ) : null}
        {isMonth ? (
          <MonthGrid
            family={family}
            days={days}
            month={anchor.slice(0, 7)}
            today={today}
          />
        ) : (
          <WeekList
            family={family}
            days={days}
            today={today}
            onOpenEvent={openEvent}
          />
        )}
        {eventsError ? (
          <Text
            accessibilityRole="alert"
            className="mx-1 font-semibold text-[13px] leading-[18px] text-error"
          >
            {t('events.loadFailed')}
          </Text>
        ) : null}
        <CalendarLegend family={family} />
        {upcomingCustody ? (
          <Upcoming
            family={family}
            items={upcomingItems(
              upcomingHandovers(upcomingCustody.handovers, UPCOMING_COUNT),
              (upcomingEvents ?? []).filter(event => notOver(event, now)),
              UPCOMING_COUNT,
            )}
            onOpenEvent={openEvent}
          />
        ) : null}
      </>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        contentContainerClassName="gap-3 px-4 pt-5 pb-8"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={color('primary')}
          />
        }
      >
        <View className="flex-row items-center justify-between pt-2">
          <Text
            accessibilityRole="header"
            className="font-extrabold text-[24px] text-text"
          >
            {t('calendar.title')}
          </Text>
          <Pressable
            onPress={() => navigation.navigate('EventForm')}
            accessibilityRole="button"
            accessibilityLabel={t('events.add')}
            className="h-11 w-11 items-center justify-center rounded-full bg-accent active:opacity-80"
          >
            <PlusIcon color={color('on-accent')} />
          </Pressable>
        </View>

        <View
          accessibilityLabel={t('calendar.view')}
          className="flex-row gap-1 rounded-full border border-border bg-card p-1"
        >
          <ViewChoice
            label={t('calendar.month')}
            selected={isMonth}
            onPress={showMonth}
          />
          <ViewChoice
            label={t('calendar.week')}
            selected={!isMonth}
            onPress={showWeek}
          />
        </View>

        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={showPrevious}
            accessibilityRole="button"
            accessibilityLabel={t(
              isMonth ? 'calendar.previousMonth' : 'calendar.previousWeek',
            )}
            className="h-11 w-12 items-center justify-center"
          >
            <ChevronLeftIcon color={color('text')} />
          </Pressable>
          <Text
            accessibilityRole="header"
            className="font-bold text-[17px] text-text"
          >
            {isMonth ? monthTitle(anchor) : weekTitle(anchor)}
          </Text>
          <Pressable
            onPress={showNext}
            accessibilityRole="button"
            accessibilityLabel={t(
              isMonth ? 'calendar.nextMonth' : 'calendar.nextWeek',
            )}
            className="h-11 w-12 items-center justify-center"
          >
            <ChevronRightIcon color={color('text')} />
          </Pressable>
        </View>

        {body}
      </ScrollView>
    </SafeAreaView>
  );
}

function ViewChoice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={`min-h-[40px] flex-1 items-center justify-center rounded-full ${
        selected ? 'bg-primary' : ''
      }`}
    >
      <Text
        className={`font-bold text-[13px] ${
          selected ? 'text-on-primary' : 'text-text'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

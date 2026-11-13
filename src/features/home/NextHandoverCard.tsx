import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Family, Handover } from '../../api/types';
import {
  ArrowRightIcon,
  ChecklistIcon,
  ChevronRightIcon,
} from '../../components/icons';
import {
  daysBetween,
  formatShortDate,
  formatTime,
  splitLocalDateTime,
} from '../../lib/dates';
import { useTheme } from '../../theme/ThemeProvider';
import { HomeCard } from './HomeCard';
import { ParentRing } from '../custody/ParentRing';
import { parentOf } from '../custody/parents';

type Props = {
  family: Family;
  handover: Handover;
  /** Date du jour à Paris (« AAAA-MM-JJ »). */
  today: string;
  /** Ouvre « Sac à préparer ». */
  onOpenBag: () => void;
  /** Éléments cochés sur le total ; absent si le sac est vide ou pas encore chargé. */
  bagCount?: { checked: number; total: number };
};

/** Le prochain passage de garde : quand, d'un parent à l'autre, et le sac à préparer. */
export function NextHandoverCard({
  family,
  handover,
  today,
  onOpenBag,
  bagCount,
}: Props) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const { date, time } = splitLocalDateTime(handover.at);
  const from = parentOf(family, handover.from);
  const to = parentOf(family, handover.to);

  const days = daysBetween(today, date);
  const delay =
    days <= 0
      ? t('home.nextHandover.today')
      : days === 1
      ? t('home.nextHandover.tomorrow')
      : t('home.nextHandover.inDays', { count: days });

  return (
    <HomeCard title={t('home.nextHandover.title')} aside={delay}>
      <View className="flex-row items-center gap-2.5">
        <ParentRing role={handover.from} initial={from.initial} size="sm" />
        <ArrowRightIcon color={color('text-secondary')} />
        <ParentRing role={handover.to} initial={to.initial} size="sm" />
        <View className="ml-1 flex-1">
          <Text className="font-bold text-[15px] text-text">
            {t('home.nextHandover.when', {
              date: formatShortDate(date),
              time: formatTime(time),
            })}
          </Text>
          <Text className="font-regular text-[13px] text-text-secondary">
            {t('home.nextHandover.direction', {
              from: from.name,
              to: to.name,
            })}
          </Text>
        </View>
      </View>
      <Pressable
        onPress={onOpenBag}
        accessibilityRole="link"
        className="min-h-[48px] flex-row items-center justify-between rounded-[14px] bg-background px-4"
      >
        <View className="flex-row items-center gap-2.5">
          <ChecklistIcon color={color('primary')} />
          <Text className="font-bold text-[15px] text-text">
            {t('home.bag.title')}
          </Text>
        </View>
        {bagCount ? (
          <Text className="font-semibold text-[13px] text-text-secondary">
            {t('home.bag.count', bagCount)}
          </Text>
        ) : (
          <ChevronRightIcon color={color('text-secondary')} />
        )}
      </Pressable>
    </HomeCard>
  );
}

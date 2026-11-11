import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { FamilyRole } from '../../api/types';
import { LegendItem } from '../../components/LegendItem';
import type { Night, Weekday } from '../../schemas/custody';

/** Couleurs de garde : toujours accompagnées de l'initiale, jamais en couleur de texte. */
const PARENT_CELL: Record<FamilyRole, string> = {
  PARENT_A: 'border-parent-a bg-parent-a-soft',
  PARENT_B: 'border-parent-b bg-parent-b-soft',
};

/** L'autre parent n'a pas encore rejoint la famille : pas de prénom ni d'initiale. */
const OTHER_INITIAL = '?';

type Props = {
  nights: Night[];
  /** Première case = jour de bascule. */
  handoverWeekday: Weekday;
  myRole: FamilyRole;
  myName: string;
  /** Rythme personnalisé : chaque case se touche pour changer de parent. */
  onToggle?: (index: number) => void;
};

/** Aperçu de deux semaines de garde, à partir du jour de bascule. */
export function CustodyPreview({
  nights,
  handoverWeekday,
  myRole,
  myName,
  onToggle,
}: Props) {
  const { t } = useTranslation();
  const otherRole: FamilyRole = myRole === 'PARENT_A' ? 'PARENT_B' : 'PARENT_A';
  const myInitial = myName.charAt(0).toUpperCase();
  const meCount = nights.filter(night => night === 'me').length;
  const weeks = [nights.slice(0, 7), nights.slice(7, 14)];

  return (
    <View className="gap-3 rounded-2xl border-2 border-border bg-card p-4">
      <Text className="font-bold text-[13px] text-text">
        {t(
          onToggle
            ? 'onboarding.schedule.preview.customTitle'
            : 'onboarding.schedule.preview.title',
        )}
      </Text>

      <View
        // Lecture seule : le résumé ci-dessous suffit aux lecteurs d'écran.
        accessibilityElementsHidden={!onToggle}
        importantForAccessibility={onToggle ? 'auto' : 'no-hide-descendants'}
        className="gap-1"
      >
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} className="flex-row gap-1">
            {week.map((night, dayIndex) => {
              const index = weekIndex * 7 + dayIndex;
              const weekday = (((handoverWeekday - 1 + index) % 7) +
                1) as Weekday;
              const role = night === 'me' ? myRole : otherRole;
              const cell = (
                <>
                  <Text className="font-semibold text-[11px] text-text">
                    {t(`weekdays.initial.${weekday}`)}
                  </Text>
                  <Text className="font-extrabold text-[13px] text-text">
                    {night === 'me' ? myInitial : OTHER_INITIAL}
                  </Text>
                </>
              );
              const className = `h-11 flex-1 items-center justify-center rounded-md border-2 ${PARENT_CELL[role]}`;
              return onToggle ? (
                <Pressable
                  key={index}
                  onPress={() => onToggle(index)}
                  accessibilityRole="button"
                  accessibilityLabel={t('onboarding.schedule.preview.night', {
                    day: t(`weekdays.long.${weekday}`),
                    week: weekIndex + 1,
                    parent:
                      night === 'me'
                        ? myName
                        : t('onboarding.schedule.preview.otherParent'),
                  })}
                  accessibilityHint={t('onboarding.schedule.preview.nightHint')}
                  className={`${className} active:opacity-70`}
                >
                  {cell}
                </Pressable>
              ) : (
                <View key={index} className={className}>
                  {cell}
                </View>
              );
            })}
          </View>
        ))}
      </View>

      <Text className="font-regular text-[13px] leading-[18px] text-text">
        {t('onboarding.schedule.preview.summary', {
          me: meCount,
          other: nights.length - meCount,
          myName,
        })}
      </Text>

      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="flex-row flex-wrap gap-x-4 gap-y-1"
      >
        <LegendItem
          cell={PARENT_CELL[myRole]}
          text={`${myInitial} · ${myName}`}
        />
        <LegendItem
          cell={PARENT_CELL[otherRole]}
          text={`${OTHER_INITIAL} · ${t(
            'onboarding.schedule.preview.otherParentLegend',
          )}`}
        />
      </View>
    </View>
  );
}

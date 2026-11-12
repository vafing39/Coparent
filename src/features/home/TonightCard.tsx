import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Family, FamilyRole, Handover } from '../../api/types';
import {
  formatLongDate,
  formatTime,
  splitLocalDateTime,
} from '../../lib/dates';
import { joinNames } from '../../lib/text';
import { ParentRing } from './ParentRing';
import { parentOf } from './parents';

const SOFT: Record<FamilyRole, string> = {
  PARENT_A: 'bg-parent-a-soft',
  PARENT_B: 'bg-parent-b-soft',
};

type Props = {
  family: Family;
  /** Parent de la nuit d'aujourd'hui. */
  parent: FamilyRole;
  /** Rythme pas encore validé par les deux parents (ou mode solo). */
  proposed: boolean;
  nextHandover: Handover | null;
};

/** Chez qui sont les enfants ce soir, et jusqu'à quand. */
export function TonightCard({ family, parent, proposed, nextHandover }: Props) {
  const { t } = useTranslation();
  const { name, initial } = parentOf(family, parent);
  const title = t(
    proposed ? 'home.tonight.titleProposed' : 'home.tonight.title',
  );
  const until = nextHandover ? splitLocalDateTime(nextHandover.at) : null;

  return (
    <View
      accessible
      accessibilityLabel={title}
      className={`gap-3 rounded-[20px] p-[18px] ${SOFT[parent]}`}
    >
      <Text className="font-bold text-[13px] text-text">{title}</Text>
      <View className="flex-row items-center gap-3">
        <ParentRing role={parent} initial={initial} />
        <View className="flex-1">
          <Text className="font-extrabold text-[20px] leading-[26px] text-text">
            {t('home.tonight.whereabouts', {
              count: family.children.length,
              children: joinNames(family.children.map(c => c.firstName)),
              parent: name,
            })}
          </Text>
          {until ? (
            <Text className="font-regular text-[13px] text-text">
              {t('home.tonight.until', {
                date: formatLongDate(until.date),
                time: formatTime(until.time),
              })}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

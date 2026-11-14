import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Family, FamilyDocument } from '../../api/types';
import { ChevronDownIcon, ChevronUpIcon } from '../../components/icons';
import { useTheme } from '../../theme/ThemeProvider';
import { historyText } from './documentText';

/**
 * « Consultations (n) » : chaque ouverture (et la suppression), la plus récente
 * d'abord. Repliée au départ, dépliée d'un appui.
 */
export function DocumentHistory({
  family,
  document,
}: {
  family: Family;
  document: FamilyDocument;
}) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const [expanded, setExpanded] = useState(false);

  if (document.history.length === 0) {
    return (
      <View className="gap-1">
        <Text className="font-bold text-[13px] text-text">
          {t('documents.row.views')}
        </Text>
        <Text className="font-regular text-[13px] text-text-secondary">
          {t('documents.row.noViews')}
        </Text>
      </View>
    );
  }

  const Chevron = expanded ? ChevronUpIcon : ChevronDownIcon;
  return (
    <View className="gap-1">
      <Pressable
        onPress={() => setExpanded(value => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        className="min-h-[44px] flex-row items-center gap-1 self-start"
      >
        <Text className="font-bold text-[13px] text-text">
          {t('documents.row.viewsCount', {
            count: document.history.length,
          })}
        </Text>
        <Chevron color={color('text-secondary')} />
      </Pressable>
      {expanded
        ? document.history.map(line => (
            <Text
              key={`${line.kind}-${line.at}`}
              className="font-regular text-[13px] text-text-secondary"
            >
              {historyText(family, line)}
            </Text>
          ))
        : null}
    </View>
  );
}

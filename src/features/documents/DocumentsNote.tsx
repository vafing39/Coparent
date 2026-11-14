import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LockIcon } from '../../components/icons';
import { useTheme } from '../../theme/ThemeProvider';

/** Mention sous la liste : chaque ouverture est tracée, pour les deux parents. */
export function DocumentsNote() {
  const { t } = useTranslation();
  const { color } = useTheme();
  return (
    <View className="mx-1 flex-row gap-1.5">
      <View className="mt-0.5">
        <LockIcon size={16} strokeWidth={2} color={color('text-secondary')} />
      </View>
      <Text className="flex-1 font-regular text-[13px] leading-[18px] text-text-secondary">
        {t('documents.note')}
      </Text>
    </View>
  );
}

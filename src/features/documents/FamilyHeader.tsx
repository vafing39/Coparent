import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { GearIcon, PlusIcon } from '../../components/icons';
import { useTheme } from '../../theme/ThemeProvider';

/**
 * Titre « Famille », bouton + (ajouter un document, quand la section Documents est ouverte) et
 * roue dentée (« Compte et famille »).
 */
export function FamilyHeader({
  onAddDocument,
  onOpenAccount,
}: {
  onAddDocument?: () => void;
  onOpenAccount: () => void;
}) {
  const { t } = useTranslation();
  const { color } = useTheme();
  return (
    <View className="flex-row items-center justify-between pt-2">
      <Text
        accessibilityRole="header"
        className="font-extrabold text-[24px] text-text"
      >
        {t('familyTab.title')}
      </Text>
      <View className="flex-row items-center gap-2">
        {onAddDocument ? (
          <Pressable
            onPress={onAddDocument}
            accessibilityRole="button"
            accessibilityLabel={t('documents.add')}
            className="h-11 w-11 items-center justify-center rounded-full bg-accent active:opacity-80"
          >
            <PlusIcon color={color('on-accent')} />
          </Pressable>
        ) : null}
        <Pressable
          onPress={onOpenAccount}
          accessibilityRole="button"
          accessibilityLabel={t('home.account.label')}
          accessibilityHint={t('home.account.hint')}
          className="h-11 w-11 items-center justify-center rounded-full bg-primary-soft"
        >
          <GearIcon size={22} color={color('primary')} />
        </Pressable>
      </View>
    </View>
  );
}

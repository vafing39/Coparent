import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

type Props = {
  title: string;
  onCancel: () => void;
  /** Libellé du bouton principal (« Ajouter », « Enregistrer »…). */
  actionLabel: string;
  onAction: () => void;
  /** Envoi en cours : le bouton principal est désactivé. */
  busy?: boolean;
};

/** En-tête d'un écran présenté en modal : « Annuler », le titre, et le bouton principal. */
export function ModalHeader({
  title,
  onCancel,
  actionLabel,
  onAction,
  busy = false,
}: Props) {
  const { t } = useTranslation();
  return (
    <View className="flex-row items-center justify-between px-3 pb-1.5 pt-4">
      <Pressable
        onPress={onCancel}
        accessibilityRole="button"
        className="min-h-[48px] justify-center px-2"
      >
        <Text className="font-bold text-[15px] text-text">
          {t('common.cancel')}
        </Text>
      </Pressable>
      <Text
        accessibilityRole="header"
        className="font-extrabold text-[17px] text-text"
      >
        {title}
      </Text>
      <Pressable
        onPress={onAction}
        disabled={busy}
        accessibilityRole="button"
        accessibilityState={{ disabled: busy, busy }}
        className={`min-h-[44px] justify-center rounded-full bg-primary px-4 ${
          busy ? 'opacity-60' : ''
        }`}
      >
        <Text className="font-extrabold text-[15px] text-on-primary">
          {actionLabel}
        </Text>
      </Pressable>
    </View>
  );
}

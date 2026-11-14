import React from 'react';
import {
  Alert,
  Image,
  ImageSourcePropType,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ReceiptPhoto } from '../../api/expenses';
import { CameraIcon } from '../../components/icons';
import { pickReceiptPhoto } from '../../lib/receiptPhoto';
import { useTheme } from '../../theme/ThemeProvider';

type Props = {
  /** Image affichée : la photo choisie, ou le justificatif déjà envoyé ; null sans justificatif. */
  preview: ImageSourcePropType | null;
  onPick: (photo: ReceiptPhoto) => void;
  onRemove: () => void;
};

/**
 * Justificatif facultatif de la dépense. Sans photo : un bouton pointillé, qui propose de prendre
 * une photo ou d'en choisir une. Avec : la miniature, « Remplacer » et « Retirer ».
 */
export function ReceiptField({ preview, onPick, onRemove }: Props) {
  const { t } = useTranslation();
  const { color } = useTheme();

  const pick = async (source: 'camera' | 'library') => {
    const result = await pickReceiptPhoto(source);
    if ('photo' in result) {
      onPick(result.photo);
    } else if ('error' in result) {
      Alert.alert(t(`expenses.receipt.${result.error}`));
    }
  };
  const choose = () =>
    Alert.alert(t('expenses.receipt.chooseTitle'), undefined, [
      { text: t('expenses.receipt.takePhoto'), onPress: () => pick('camera') },
      { text: t('expenses.receipt.pickPhoto'), onPress: () => pick('library') },
      { text: t('expenses.receipt.cancel'), style: 'cancel' },
    ]);

  if (!preview) {
    return (
      <Pressable
        onPress={choose}
        accessibilityRole="button"
        accessibilityLabel={t('expenses.receipt.add')}
        accessibilityHint={t('expenses.receipt.privacy')}
        className="items-center gap-1.5 rounded-[20px] border-[1.5px] border-dashed border-border bg-card px-4 py-5"
      >
        <CameraIcon size={24} color={color('primary')} />
        <Text className="font-bold text-[15px] text-primary">
          {t('expenses.receipt.add')}
        </Text>
        <Text className="text-center font-regular text-[12px] text-text-secondary">
          {t('expenses.receipt.privacy')}
        </Text>
      </Pressable>
    );
  }

  return (
    <View className="flex-row items-center gap-3 rounded-[20px] bg-card p-3">
      <Image
        source={preview}
        accessibilityLabel={t('expenses.receipt.thumbnail')}
        resizeMode="cover"
        className="h-16 w-16 rounded-[12px] bg-background"
      />
      <View className="flex-1 gap-0.5">
        <Text className="font-bold text-[15px] text-text">
          {t('expenses.receipt.thumbnail')}
        </Text>
        <Text className="font-regular text-[12px] text-text-secondary">
          {t('expenses.receipt.privacy')}
        </Text>
      </View>
      <View className="gap-1">
        <Pressable
          onPress={choose}
          accessibilityRole="button"
          className="min-h-[36px] justify-center px-2"
        >
          <Text className="font-bold text-[14px] text-primary">
            {t('expenses.receipt.replace')}
          </Text>
        </Pressable>
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          className="min-h-[36px] justify-center px-2"
        >
          <Text className="font-bold text-[14px] text-text-secondary">
            {t('expenses.receipt.remove')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

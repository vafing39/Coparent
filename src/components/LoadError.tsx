import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';

type Props = {
  message: string;
  onRetry: () => void;
  /** Par défaut « Réessayer ». */
  actionLabel?: string;
};

/** État d'erreur d'un écran : la cause, puis une action pour réessayer. */
export function LoadError({ message, onRetry, actionLabel }: Props) {
  const { t } = useTranslation();
  return (
    <View className="flex-1 justify-center gap-5 px-6">
      <Text
        accessibilityRole="alert"
        className="font-regular text-[15px] leading-[22px] text-text"
      >
        {message}
      </Text>
      <Button label={actionLabel ?? t('common.retry')} onPress={onRetry} />
    </View>
  );
}

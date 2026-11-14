import React from 'react';
import { Text, View } from 'react-native';
import { ClockIcon } from '../../../components/icons';
import { useTheme } from '../../../theme/ThemeProvider';

/** Une phrase précédée de son icône (horloge : en attente ; coche : rien à régler). */
export function StatusLine({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <View accessibilityLiveRegion="polite" className="flex-row gap-2">
      <View className="mt-0.5">{icon}</View>
      <Text className="flex-1 font-regular text-[15px] leading-[21px] text-text">
        {text}
      </Text>
    </View>
  );
}

/** Statut en attente : précédé d'une horloge. */
export function PendingLine({ text }: { text: string }) {
  const { color } = useTheme();
  return (
    <StatusLine
      icon={<ClockIcon size={18} color={color('pending')} strokeWidth={2.2} />}
      text={text}
    />
  );
}

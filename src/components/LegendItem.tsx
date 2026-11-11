import React from 'react';
import { Text, View } from 'react-native';

type Props = {
  /** Classes NativeWind de la pastille (bordure et fond, jetons uniquement). */
  cell: string;
  text: string;
};

/** Entrée de légende : une pastille de couleur suivie de son libellé. */
export function LegendItem({ cell, text }: Props) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className={`h-3 w-3 rounded border-2 ${cell}`} />
      <Text className="font-regular text-[13px] text-text">{text}</Text>
    </View>
  );
}

import React from 'react';
import { Text, View } from 'react-native';

/** Une ligne d'un écran de détail : un petit libellé, puis la valeur en gras. Lue d'un seul tenant. */
export function DetailRow({
  label,
  value,
  divider = false,
}: {
  label: string;
  value: string;
  divider?: boolean;
}) {
  return (
    <View
      accessible
      className={`min-h-[56px] justify-center py-2 ${
        divider ? 'border-t border-border' : ''
      }`}
    >
      <Text className="font-regular text-[13px] text-text-secondary">
        {label}
      </Text>
      <Text className="font-bold text-[15px] text-text">{value}</Text>
    </View>
  );
}

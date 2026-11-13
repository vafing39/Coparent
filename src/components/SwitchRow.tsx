import React from 'react';
import { Pressable, Text, View } from 'react-native';

/** Interrupteur sur une ligne : le libellé à gauche, l'interrupteur à droite. */
export function SwitchRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      className="min-h-[44px] flex-row items-center"
    >
      <Text className="flex-1 font-bold text-[15px] text-text">{label}</Text>
      <View
        className={`h-7 w-12 justify-center rounded-full px-[3px] ${
          value ? 'items-end bg-primary' : 'items-start bg-text-secondary'
        }`}
      >
        <View className="h-[22px] w-[22px] rounded-full bg-card" />
      </View>
    </Pressable>
  );
}

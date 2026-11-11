import React from 'react';
import { Pressable, Text, View } from 'react-native';

type Props = {
  label: string;
  hint?: string;
  checked: boolean;
  onPress: () => void;
};

/**
 * Choix unique présenté en carte (rond + libellé + aide). À placer dans une View
 * `accessibilityRole="radiogroup"` portant le libellé du groupe.
 */
export function RadioCard({ label, hint, checked, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      accessibilityHint={hint}
      className={`min-h-[60px] flex-row items-center gap-3 rounded-2xl px-3.5 py-2 active:opacity-80 ${
        checked
          ? 'border-2 border-primary bg-primary-soft'
          : 'border-[1.5px] border-border bg-surface'
      }`}
    >
      <View
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        className={`h-[22px] w-[22px] items-center justify-center rounded-full border-2 ${
          checked ? 'border-primary' : 'border-text-secondary'
        }`}
      >
        {checked ? (
          <View className="h-2.5 w-2.5 rounded-full bg-primary" />
        ) : null}
      </View>
      <View className="flex-1">
        <Text className="font-bold text-[15px] text-text">{label}</Text>
        {hint ? (
          <Text className="font-regular text-[13px] text-text-secondary">
            {hint}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

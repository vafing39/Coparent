import React from 'react';
import { Pressable, Text } from 'react-native';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** radio : choix unique dans un radiogroup ; checkbox : plusieurs choix. */
  role: 'radio' | 'checkbox';
};

/** Puce de choix (catégorie, enfant, payeur) : pleine quand elle est choisie. */
export function Chip({ label, selected, onPress, role }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={role}
      accessibilityState={{ checked: selected }}
      className={`min-h-[40px] justify-center rounded-full border px-3 ${
        selected ? 'border-primary bg-primary' : 'border-border bg-card'
      }`}
    >
      <Text
        className={`font-bold text-[13px] ${
          selected ? 'text-on-primary' : 'text-text'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

import React from 'react';
import { Pressable, Text } from 'react-native';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  /** Par défaut, le libellé visible. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

const containerByVariant = {
  primary: 'bg-primary',
  secondary: 'bg-surface border-[1.5px] border-primary',
} as const;

const labelByVariant = {
  primary: 'text-on-primary',
  secondary: 'text-primary',
} as const;

/** Bouton pilule du design system (hauteur 52, cible tactile ≥ 44). */
export function Button({
  label,
  onPress,
  variant = 'primary',
  accessibilityLabel,
  accessibilityHint,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      className={`min-h-[52px] items-center justify-center rounded-full px-5 active:opacity-80 ${containerByVariant[variant]}`}
    >
      <Text
        className={`font-extrabold text-[17px] text-center ${labelByVariant[variant]}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

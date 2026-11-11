import React from 'react';
import { Text } from 'react-native';

type Props = {
  children: string;
  onPress: () => void;
  accessibilityLabel?: string;
};

/** Lien en ligne, à placer dans un <Text> parent. */
export function TextLink({ children, onPress, accessibilityLabel }: Props) {
  return (
    <Text
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel ?? children}
      className="text-primary underline"
    >
      {children}
    </Text>
  );
}

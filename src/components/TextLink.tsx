import React from 'react';
import { Text } from 'react-native';

type Props = {
  /** Texte du lien ; fourni par <Trans> quand le lien est dans une phrase traduite. */
  children?: React.ReactNode;
  onPress: () => void;
  accessibilityLabel?: string;
};

/** Lien en ligne, à placer dans un <Text> parent. */
export function TextLink({ children, onPress, accessibilityLabel }: Props) {
  return (
    <Text
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={
        accessibilityLabel ??
        (typeof children === 'string' ? children : undefined)
      }
      className="text-primary underline"
    >
      {children}
    </Text>
  );
}

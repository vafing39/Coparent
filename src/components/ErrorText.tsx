import React from 'react';
import { Text } from 'react-native';

/** Message d'erreur sous un champ ou au-dessus d'un bouton, annoncé par les lecteurs d'écran. */
export function ErrorText({ text }: { text?: string }) {
  return (
    <Text
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className="font-semibold text-[13px] leading-[18px] text-error"
    >
      {text}
    </Text>
  );
}

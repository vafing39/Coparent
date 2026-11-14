import React from 'react';
import { Text, View } from 'react-native';

/** Section de l'onglet Famille pas encore construite : une phrase sur ce qu'elle contiendra. */
export function ComingSoonCard({ text }: { text: string }) {
  return (
    <View className="rounded-[20px] bg-card px-4 py-7">
      <Text className="text-center font-regular text-[15px] leading-[22px] text-text-secondary">
        {text}
      </Text>
    </View>
  );
}

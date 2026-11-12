import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Onglet sans contenu pour l'instant : son titre et une phrase. Sert d'état vide
 * (Famille, Dépenses : priorité 2) ou d'attente (fonction pas encore construite).
 */
export function TabPlaceholder({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <SafeAreaView className="flex-1 bg-background px-6" edges={['top']}>
      <View className="gap-2 pt-7">
        <Text
          accessibilityRole="header"
          className="font-extrabold text-[30px] leading-[36px] text-text"
        >
          {title}
        </Text>
        <Text className="font-regular text-[15px] leading-[22px] text-text-secondary">
          {text}
        </Text>
      </View>
    </SafeAreaView>
  );
}

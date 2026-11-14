import React from 'react';
import { Text, View } from 'react-native';

/** Carte blanche avec un titre de section (en-tête accessible), puis son contenu. */
export function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-2.5 rounded-[20px] bg-card px-4 py-3.5">
      <Text
        accessibilityRole="header"
        className="font-extrabold text-[15px] text-text"
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

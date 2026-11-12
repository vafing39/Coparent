import React from 'react';
import { Pressable, Text, View } from 'react-native';

type Props = {
  title: string;
  /** À droite du titre (ex. « dans 3 jours »). */
  aside?: string;
  /** Lien à droite du titre (ex. « Tout voir »), à la place de `aside`. */
  action?: CardAction;
  children: React.ReactNode;
};

type CardAction = { label: string; onPress: () => void };

/** Carte blanche de l'accueil, avec son titre. */
export function HomeCard({ title, aside, action, children }: Props) {
  return (
    <View className="gap-3 rounded-[20px] border border-border bg-card p-[18px]">
      <View
        className={`flex-row justify-between gap-2 ${
          action ? '-my-3 items-center' : 'items-baseline'
        }`}
      >
        <Text
          accessibilityRole="header"
          className="font-bold text-[17px] leading-[22px] text-text"
        >
          {title}
        </Text>
        {action ? (
          <Pressable
            onPress={action.onPress}
            accessibilityRole="link"
            className="min-h-[44px] justify-center"
          >
            <Text className="font-extrabold text-[15px] text-primary">
              {action.label}
            </Text>
          </Pressable>
        ) : aside ? (
          <Text className="font-regular text-[13px] text-text-secondary">
            {aside}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

/** Carte sans contenu pour l'instant : un titre et une phrase. */
export function EmptyCard({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: CardAction;
}) {
  return (
    <HomeCard title={title} action={action}>
      <Text className="font-regular text-[15px] leading-[21px] text-text-secondary">
        {text}
      </Text>
    </HomeCard>
  );
}

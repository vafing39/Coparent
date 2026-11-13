import React from 'react';
import { Text, View } from 'react-native';
import type { ToDoItem } from '../../api/types';
import { ToDoNudge } from './ToDoNudge';
import { ToDoRow } from './ToDoRow';

/**
 * Une section de l'écran « À traiter » : son titre, puis ses demandes dans une carte. Côté
 * theirs, chaque ligne dit ce qui se passe sans réponse et propose « Relancer ».
 */
export function ToDoSection({
  title,
  items,
  side,
}: {
  title: string;
  items: ToDoItem[];
  side: 'mine' | 'theirs';
}) {
  return (
    <View className="gap-1.5">
      <Text
        accessibilityRole="header"
        className="mx-1 font-bold text-[13px] text-text-secondary"
      >
        {title}
      </Text>
      <View className="rounded-[20px] border border-border bg-card px-4">
        {items.map((item, index) =>
          side === 'theirs' ? (
            <ToDoRow
              key={item.id}
              item={item}
              side={side}
              divider={index > 0}
              detailed
            >
              <ToDoNudge item={item} />
            </ToDoRow>
          ) : (
            <ToDoRow
              key={item.id}
              item={item}
              side={side}
              divider={index > 0}
            />
          ),
        )}
      </View>
    </View>
  );
}

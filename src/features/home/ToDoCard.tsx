import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { useToDo } from '../../hooks/useToDo';
import { HomeCard } from './HomeCard';
import { ToDoRow } from './ToDoRow';

/** Combien de demandes l'accueil montre avant « Tout voir ». */
const PREVIEW_COUNT = 2;

/** « À traiter » sur l'accueil : les premières demandes (les miennes d'abord) et « Tout voir (n) ». */
export function ToDoCard({ onSeeAll }: { onSeeAll: () => void }) {
  const { t } = useTranslation();
  const { toDo, toDoError, reloadToDo } = useToDo();
  const total = toDo ? toDo.mine.length + toDo.theirs.length : 0;
  const action = {
    label:
      total > 0
        ? t('home.toDo.seeAllCount', { count: total })
        : t('home.toDo.seeAll'),
    onPress: onSeeAll,
  };

  if (!toDo) {
    return (
      <HomeCard title={t('home.toDo.title')} action={action}>
        {toDoError ? (
          <>
            <Text
              accessibilityRole="alert"
              className="font-regular text-[15px] leading-[22px] text-text"
            >
              {t('home.toDo.loadFailed')}
            </Text>
            <Button
              label={t('common.retry')}
              variant="secondary"
              onPress={reloadToDo}
            />
          </>
        ) : (
          <View
            accessible
            accessibilityLabel={t('common.loading')}
            className="h-[52px] rounded-md bg-surface"
          />
        )}
      </HomeCard>
    );
  }

  const preview = [
    ...toDo.mine.map(item => ({ item, side: 'mine' as const })),
    ...toDo.theirs.map(item => ({ item, side: 'theirs' as const })),
  ].slice(0, PREVIEW_COUNT);

  return (
    <HomeCard title={t('home.toDo.title')} action={action}>
      {preview.length === 0 ? (
        <Text className="font-regular text-[15px] leading-[21px] text-text-secondary">
          {t('home.toDo.empty')}
        </Text>
      ) : (
        <View>
          {preview.map(({ item, side }, index) => (
            <ToDoRow
              key={item.id}
              item={item}
              side={side}
              divider={index > 0}
            />
          ))}
        </View>
      )}
    </HomeCard>
  );
}

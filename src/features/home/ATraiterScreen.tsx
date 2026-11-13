import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadError } from '../../components/LoadError';
import { ChevronLeftIcon } from '../../components/icons';
import { useResetOnUnmount } from '../../hooks/useResetOnUnmount';
import { useToDo } from '../../hooks/useToDo';
import type { ToDoItem } from '../../api/types';
import type { AppScreenProps } from '../../navigation/types';
import { useTheme } from '../../theme/ThemeProvider';
import { openToDoItem } from './openToDoItem';
import { ToDoSection } from './ToDoSection';

/**
 * « À traiter » : tout ce qui attend une réponse (cahier des charges, 8), de moi puis de
 * l'autre parent (depuis quand, ce qui se passe sans réponse, « Relancer » une fois par
 * jour). Une demande d'échange de garde ou un rythme à valider ouvre son écran ; les autres
 * lignes ne mènent encore nulle part.
 */
export function ATraiterScreen({ navigation }: AppScreenProps<'ATraiter'>) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const { toDo, toDoError, reloadToDo, resetNudgeToDo } = useToDo();
  useResetOnUnmount(resetNudgeToDo);
  const openItem = (item: ToDoItem) => openToDoItem(navigation, item);

  let body: React.ReactNode;
  if (toDo) {
    const empty = toDo.mine.length === 0 && toDo.theirs.length === 0;
    body = (
      <ScrollView contentContainerClassName="gap-3.5 px-4 pt-1 pb-6">
        {empty ? (
          <View className="rounded-[20px] border border-border bg-card p-[18px]">
            <Text className="font-regular text-[15px] leading-[21px] text-text-secondary">
              {t('home.toDo.empty')}
            </Text>
          </View>
        ) : null}
        {toDo.mine.length > 0 ? (
          <ToDoSection
            title={t('home.toDo.mine', { count: toDo.mine.length })}
            items={toDo.mine}
            side="mine"
            onOpen={openItem}
          />
        ) : null}
        {toDo.theirs.length > 0 ? (
          <>
            <ToDoSection
              title={t('home.toDo.theirs', {
                name: toDo.theirs[0].assignee,
                count: toDo.theirs.length,
              })}
              items={toDo.theirs}
              side="theirs"
              onOpen={openItem}
            />
            <Text className="mx-1 font-regular text-[13px] leading-[18px] text-text-secondary">
              {t('home.toDo.nudgeRule')}
            </Text>
          </>
        ) : null}
      </ScrollView>
    );
  } else if (toDoError) {
    body = (
      <LoadError message={t('home.toDo.loadFailed')} onRetry={reloadToDo} />
    );
  } else {
    body = (
      <View
        accessible
        accessibilityLabel={t('common.loading')}
        className="gap-3 px-4 pt-2"
      >
        <View className="h-[18px] w-1/2 rounded-md bg-surface" />
        <View className="h-[180px] rounded-[20px] bg-surface" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center gap-1 pb-1 pl-2 pr-4 pt-6">
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          className="h-12 w-12 items-center justify-center rounded-full"
        >
          <ChevronLeftIcon color={color('text')} />
        </Pressable>
        <Text
          accessibilityRole="header"
          className="flex-1 font-extrabold text-[24px] text-text"
        >
          {t('home.toDo.title')}
        </Text>
      </View>
      {body}
    </SafeAreaView>
  );
}

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { nudgeErrorMessage, nudgedToday } from '../../api/toDo';
import type { ToDoItem } from '../../api/types';
import { BellIcon, CheckIcon } from '../../components/icons';
import { useToDo } from '../../hooks/useToDo';
import { useTheme } from '../../theme/ThemeProvider';

/** « Relancer {prénom} », ou « Rappel envoyé » quand l'autre parent a déjà été relancé aujourd'hui. */
export function ToDoNudge({ item }: { item: ToDoItem }) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const { nudgeToDo, nudgingToDoId, nudgeToDoError, nudgeToDoErrorId } =
    useToDo();

  if (nudgedToday(item)) {
    return (
      <View accessible className="flex-row items-center gap-1">
        <CheckIcon size={14} color={color('validated')} strokeWidth={2.6} />
        <Text className="font-bold text-[13px] text-validated">
          {t('home.toDo.nudged')}
        </Text>
      </View>
    );
  }
  const busy = nudgingToDoId === item.id;
  return (
    <View className="items-start gap-1.5">
      <Pressable
        onPress={() => nudgeToDo(item.id)}
        disabled={nudgingToDoId !== undefined}
        accessibilityRole="button"
        accessibilityState={{ disabled: nudgingToDoId !== undefined, busy }}
        className={`min-h-[44px] flex-row items-center gap-1.5 rounded-full bg-primary px-4 ${
          busy ? 'opacity-60' : ''
        }`}
      >
        <BellIcon size={16} color={color('on-primary')} strokeWidth={2.2} />
        <Text className="font-extrabold text-[13px] text-on-primary">
          {t('home.toDo.nudge', { name: item.assignee })}
        </Text>
      </Pressable>
      {nudgeToDoErrorId === item.id ? (
        <Text
          accessibilityRole="alert"
          className="font-semibold text-[13px] leading-[18px] text-error"
        >
          {nudgeErrorMessage(nudgeToDoError)}
        </Text>
      ) : null}
    </View>
  );
}

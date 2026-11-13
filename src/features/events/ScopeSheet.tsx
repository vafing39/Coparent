import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { EventScope } from '../../api/types';
import { Button } from '../../components/Button';
import { formatShortDate } from '../../lib/dates';

const SCOPES: EventScope[] = ['ONE', 'FOLLOWING', 'ALL'];

type Props = {
  /** null : fermée ; sinon l'action à confirmer. */
  action: 'edit' | 'delete' | null;
  /** La séance ouverte « AAAA-MM-JJ ». */
  date: string;
  /** Séance passée : seule « Toute la série » (les séances à venir) reste possible. */
  past: boolean;
  onClose: () => void;
  onConfirm: (scope: EventScope) => void;
};

/**
 * Événement répété : quelles séances modifier ou supprimer (cette séance, celle-ci et les
 * suivantes, toute la série). Les séances passées ne changent jamais.
 */
export function ScopeSheet({ action, date, past, onClose, onConfirm }: Props) {
  const { t } = useTranslation();
  const scopes = past ? (['ALL'] as EventScope[]) : SCOPES;
  const [scope, setScope] = useState<EventScope>(past ? 'ALL' : 'ONE');
  const hint: Record<EventScope, string> = {
    ONE: formatShortDate(date),
    FOLLOWING: t('events.scope.FOLLOWINGHint', { date: formatShortDate(date) }),
    ALL: t('events.scope.ALLHint'),
  };
  const title = t(
    action === 'delete' ? 'events.scope.deleteTitle' : 'events.scope.editTitle',
  );

  return (
    <Modal
      visible={action !== null}
      onRequestClose={onClose}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <View className="flex-1 gap-3 px-4 pt-8 pb-6">
          <Text
            accessibilityRole="header"
            className="font-extrabold text-[20px] text-text"
          >
            {title}
          </Text>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel={title}
            className="gap-1.5"
          >
            {scopes.map(option => {
              const checked = scope === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => setScope(option)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked }}
                  className={`min-h-[56px] flex-row items-center gap-3 rounded-[14px] px-3.5 py-1.5 ${
                    checked
                      ? 'border-2 border-primary bg-primary-soft'
                      : 'border-[1.5px] border-border bg-card'
                  }`}
                >
                  <View
                    className={`h-[22px] w-[22px] items-center justify-center rounded-full border-2 ${
                      checked ? 'border-primary' : 'border-text-secondary'
                    }`}
                  >
                    {checked ? (
                      <View className="h-2.5 w-2.5 rounded-full bg-primary" />
                    ) : null}
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-[15px] text-text">
                      {t(`events.scope.${option}`)}
                    </Text>
                    <Text className="font-regular text-[13px] text-text-secondary">
                      {hint[option]}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Text className="font-regular text-[13px] leading-[18px] text-text-secondary">
            {t('events.scope.note')}
          </Text>
          <View className="mt-auto gap-1">
            <Button
              label={t(
                action === 'delete'
                  ? 'events.scope.delete'
                  : 'events.scope.continue',
              )}
              onPress={() => onConfirm(scope)}
            />
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              className="min-h-[44px] items-center justify-center"
            >
              <Text className="font-extrabold text-[15px] text-primary">
                {t('common.cancel')}
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

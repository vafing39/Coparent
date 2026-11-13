import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ToDoItem, ToDoKind } from '../../api/types';
import { ClockIcon } from '../../components/icons';
import { daysBetween, todayInParis } from '../../lib/dates';
import { useTheme } from '../../theme/ThemeProvider';

const KIND_TEXT = {
  CUSTODY_SCHEDULE: {
    tag: 'home.toDo.kinds.CUSTODY_SCHEDULE.tag',
    label: 'home.toDo.kinds.CUSTODY_SCHEDULE.label',
    noAnswer: 'home.toDo.kinds.CUSTODY_SCHEDULE.noAnswer',
  },
  EXCHANGE: {
    tag: 'home.toDo.kinds.EXCHANGE.tag',
    label: 'home.toDo.kinds.EXCHANGE.label',
    noAnswer: 'home.toDo.kinds.EXCHANGE.noAnswer',
  },
  EXPENSE: {
    tag: 'home.toDo.kinds.EXPENSE.tag',
    label: 'home.toDo.kinds.EXPENSE.label',
    noAnswer: 'home.toDo.kinds.EXPENSE.noAnswer',
  },
  MEMBER: {
    tag: 'home.toDo.kinds.MEMBER.tag',
    label: 'home.toDo.kinds.MEMBER.label',
    noAnswer: 'home.toDo.kinds.MEMBER.noAnswer',
  },
  DEVICE: {
    tag: 'home.toDo.kinds.DEVICE.tag',
    label: 'home.toDo.kinds.DEVICE.label',
    noAnswer: 'home.toDo.kinds.DEVICE.noAnswer',
  },
  PUBLICATION_REMOVAL: {
    tag: 'home.toDo.kinds.PUBLICATION_REMOVAL.tag',
    label: 'home.toDo.kinds.PUBLICATION_REMOVAL.label',
    noAnswer: 'home.toDo.kinds.PUBLICATION_REMOVAL.noAnswer',
  },
  PENSION: {
    tag: 'home.toDo.kinds.PENSION.tag',
    label: 'home.toDo.kinds.PENSION.label',
    noAnswer: 'home.toDo.kinds.PENSION.noAnswer',
  },
} as const satisfies Record<
  ToDoKind,
  { tag: string; label: string; noAnswer: string }
>;

/** L'écran qui permet de répondre, quand il existe : échange de garde, rythme à valider. */
export function canOpen(item: ToDoItem): boolean {
  return (
    (item.kind === 'EXCHANGE' || item.kind === 'CUSTODY_SCHEDULE') &&
    item.targetId !== null
  );
}

type Props = {
  item: ToDoItem;
  /** Ouvre l'écran de la demande (seulement si `canOpen(item)`). */
  onOpen?: () => void;
  /** mine : j'ai à répondre (on nomme qui demande) ; theirs : on attend l'autre parent. */
  side: 'mine' | 'theirs';
  /** Trait de séparation au-dessus (toutes les lignes sauf la première). */
  divider?: boolean;
  /**
   * Écran « À traiter », côté theirs : ce qui se passe sans réponse, puis `children`
   * (« Relancer »), sous le texte.
   */
  detailed?: boolean;
  children?: React.ReactNode;
};

/**
 * Une demande en attente : son type (une horloge quand on attend l'autre parent), son objet,
 * puis qui la demande (ou depuis quand on attend). Un appui ouvre l'écran de la demande quand
 * il existe (échange de garde) ; les autres lignes ne mènent encore nulle part.
 */
export function ToDoRow({
  item,
  onOpen,
  side,
  divider = false,
  detailed = false,
  children,
}: Props) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const text = KIND_TEXT[item.kind];
  const days = daysBetween(
    todayInParis(new Date(item.requestedAt)),
    todayInParis(),
  );
  const when =
    days <= 0
      ? t('home.toDo.when.today')
      : days === 1
      ? t('home.toDo.when.yesterday')
      : t('home.toDo.when.daysAgo', { count: days });
  const meta =
    side === 'mine'
      ? t('home.toDo.mineMeta', {
          label: t(text.label),
          name: item.requestedBy ?? t('home.otherParent'),
          when,
        })
      : t('home.toDo.theirsMeta', { label: t(text.label), when });

  const headerContent = (
    <>
      <View className="h-9 w-9 items-center justify-center rounded-full bg-surface">
        {side === 'theirs' ? (
          <ClockIcon size={18} color={color('pending')} strokeWidth={2.2} />
        ) : (
          <Text
            accessible={false}
            className="font-extrabold text-[11px] text-text-secondary"
          >
            {t(text.tag)}
          </Text>
        )}
      </View>
      <View className="flex-1">
        <Text className="font-bold text-[15px] text-text">{item.subject}</Text>
        <Text className="font-regular text-[13px] text-text-secondary">
          {meta}
        </Text>
      </View>
    </>
  );
  const header =
    onOpen && canOpen(item) ? (
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`${item.subject}, ${meta}`}
        className="flex-row items-center gap-3 active:opacity-70"
      >
        {headerContent}
      </Pressable>
    ) : (
      <View accessible className="flex-row items-center gap-3">
        {headerContent}
      </View>
    );

  return (
    <View
      className={`min-h-[60px] justify-center gap-2 ${
        detailed ? 'py-3' : 'py-2'
      } ${divider ? 'border-t border-border' : ''}`}
    >
      {header}
      {detailed ? (
        <Text className="ml-12 font-regular text-[13px] leading-[18px] text-text-secondary">
          {t(text.noAnswer, { name: item.assignee })}
        </Text>
      ) : null}
      {children ? <View className="ml-12">{children}</View> : null}
    </View>
  );
}

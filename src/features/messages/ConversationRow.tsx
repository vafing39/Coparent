import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Conversation } from '../../api/types';
import { listTime } from './messageRows';

/** Une discussion dans la liste : sujet, dernier message, heure, non-lus. */
export function ConversationRow({
  conversation,
  myId,
  divider,
  onPress,
}: {
  conversation: Conversation;
  myId: string | undefined;
  divider: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const last = conversation.lastMessage;
  const preview =
    last.senderId === myId
      ? t('messages.preview', { body: last.body })
      : last.body;
  const time = listTime(last.createdAt);
  const unread = conversation.unreadCount;
  const label =
    unread > 0
      ? t('messages.rowLabelUnread', {
          subject: conversation.subject,
          preview,
          time,
          unread: t('messages.unread', { count: unread }),
        })
      : t('messages.rowLabel', {
          subject: conversation.subject,
          preview,
          time,
        });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={`min-h-[64px] flex-row items-center gap-3 py-3 active:opacity-70 ${
        divider ? 'border-t border-border' : ''
      }`}
    >
      <View className="flex-1 gap-0.5">
        <Text
          numberOfLines={1}
          className={`text-[15px] text-text ${
            unread > 0 ? 'font-extrabold' : 'font-bold'
          }`}
        >
          {conversation.subject}
        </Text>
        <Text
          numberOfLines={1}
          className="font-regular text-[13px] text-text-secondary"
        >
          {preview}
        </Text>
      </View>
      <View className="items-end gap-1">
        <Text className="font-regular text-[12px] text-text-secondary">
          {time}
        </Text>
        {unread > 0 ? (
          <View className="min-w-[22px] items-center rounded-full bg-primary px-1.5 py-0.5">
            <Text className="font-extrabold text-[12px] text-on-primary">
              {unread}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Message } from '../../api/types';
import { formatInstantTime } from '../../lib/dates';

/**
 * Un message : à droite pour les miens (avec « Envoyé » ou « Lu » et l'heure), à gauche pour
 * ceux de l'autre parent. Aucune action : un message envoyé n'est ni modifiable ni supprimable.
 */
export function MessageBubble({
  message,
  mine,
}: {
  message: Message;
  mine: boolean;
}) {
  const { t } = useTranslation();
  const sentAt = formatInstantTime(message.createdAt);
  let status: string;
  let statusLabel: string;
  if (!mine) {
    status = sentAt;
    statusLabel = t('messages.receivedLabel', { time: sentAt });
  } else if (message.readAt) {
    const readAt = formatInstantTime(message.readAt);
    status = t('messages.read', { time: readAt });
    statusLabel = t('messages.readLabel', { time: readAt });
  } else {
    status = t('messages.sent', { time: sentAt });
    statusLabel = t('messages.sentLabel', { time: sentAt });
  }
  const author = mine
    ? t('messages.you')
    : message.senderFirstName ?? t('home.otherParent');

  return (
    <View
      accessible
      accessibilityLabel={t('messages.bubbleLabel', {
        author,
        status: statusLabel,
        body: message.body,
      })}
      className={`max-w-[80%] gap-1 ${
        mine ? 'items-end self-end' : 'self-start'
      }`}
    >
      <Text
        className={`px-3.5 py-3 font-regular text-[15px] leading-[21px] ${
          mine
            ? 'rounded-[20px] rounded-tr-md bg-primary text-on-primary'
            : 'rounded-[20px] rounded-tl-md bg-card text-text'
        }`}
      >
        {message.body}
      </Text>
      <Text className="mx-1 font-regular text-[13px] text-text-secondary">
        {status}
      </Text>
    </View>
  );
}

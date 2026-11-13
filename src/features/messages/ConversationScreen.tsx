import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { FamilyRole } from '../../api/types';
import { LoadError } from '../../components/LoadError';
import { ChevronLeftIcon } from '../../components/icons';
import { useFamily } from '../../hooks/useFamily';
import { useMessages } from '../../hooks/useMessages';
import type { AppScreenProps } from '../../navigation/types';
import { useTheme } from '../../theme/ThemeProvider';
import { parentOf } from '../custody/parents';
import { Composer } from './Composer';
import { MessageBubble } from './MessageBubble';
import { MessageRow, messageRows } from './messageRows';

/**
 * Une discussion avec l'autre parent, en plein écran par-dessus les onglets, en temps réel.
 * Un message envoyé n'est ni modifiable ni supprimable : aucune action ne le propose.
 */
export function ConversationScreen({
  navigation,
  route,
}: AppScreenProps<'Conversation'>) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const { family } = useFamily();
  const { conversationId, subject } = route.params;
  const {
    openConversation,
    closeConversation,
    messages,
    isLoadingMessages,
    messagesError,
    reloadMessages,
    hasOlderMessages,
    loadOlderMessages,
    isLoadingOlderMessages,
    markMessagesRead,
  } = useMessages();

  useEffect(() => {
    openConversation(conversationId);
    return () => closeConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ouvrir une fois par discussion
  }, [conversationId]);

  const [focused, setFocused] = useState(() => navigation.isFocused());
  useEffect(() => {
    const offFocus = navigation.addListener('focus', () => setFocused(true));
    const offBlur = navigation.addListener('blur', () => setFocused(false));
    return () => {
      offFocus();
      offBlur();
    };
  }, [navigation]);

  const myId = family?.members.find(m => m.role === family.myRole)?.userId;

  // Écran affiché : les messages de l'autre parent sont lus (une demande par nouveau message).
  const requestedUpTo = useRef(0);
  useEffect(() => {
    if (!focused || !messages) {
      return;
    }
    const unread = messages.filter(m => m.senderId !== myId && !m.readAt);
    const upToSeq = unread.length > 0 ? unread[unread.length - 1].seq : 0;
    if (upToSeq > requestedUpTo.current) {
      requestedUpTo.current = upToSeq;
      markMessagesRead(upToSeq);
    }
  }, [focused, messages, myId, markMessagesRead]);

  if (!family) {
    return null;
  }
  const otherRole: FamilyRole =
    family.myRole === 'PARENT_A' ? 'PARENT_B' : 'PARENT_A';
  const other = parentOf(family, otherRole);

  let body: React.ReactNode;
  if (messagesError && !messages) {
    body = (
      <LoadError message={t('messages.loadFailed')} onRetry={reloadMessages} />
    );
  } else if (isLoadingMessages || !messages) {
    body = (
      <View
        accessible
        accessibilityLabel={t('common.loading')}
        className="flex-1 justify-end gap-2.5 px-4 py-3"
      >
        <View className="h-12 w-[60%] rounded-[20px] bg-surface" />
        <View className="h-12 w-[50%] self-end rounded-[20px] bg-surface" />
        <View className="h-16 w-[70%] rounded-[20px] bg-surface" />
      </View>
    );
  } else if (messages.length === 0) {
    body = (
      <View className="flex-1 justify-end px-6 pb-6">
        <Text className="text-center font-regular text-[15px] leading-[22px] text-text-secondary">
          {t('messages.empty')}
        </Text>
      </View>
    );
  } else {
    body = (
      <FlatList<MessageRow>
        inverted
        data={messageRows(messages)}
        keyExtractor={row => row.key}
        contentContainerClassName="gap-2.5 px-4 py-3"
        onEndReached={hasOlderMessages ? loadOlderMessages : undefined}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isLoadingOlderMessages ? (
            <ActivityIndicator
              accessibilityLabel={t('messages.loadOlder')}
              color={color('primary')}
            />
          ) : undefined
        }
        renderItem={({ item }) =>
          item.kind === 'day' ? (
            <Text
              accessibilityRole="header"
              className="my-1 text-center font-bold text-[13px] text-text-secondary"
            >
              {item.label}
            </Text>
          ) : (
            <MessageBubble
              message={item.message}
              mine={item.message.senderId === myId}
            />
          )
        }
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-row items-center gap-1 border-b border-border pb-3 pl-2 pr-4 pt-6">
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            className="h-12 w-12 items-center justify-center rounded-full"
          >
            <ChevronLeftIcon color={color('text')} />
          </Pressable>
          <View className="flex-1">
            <Text
              accessibilityRole="header"
              numberOfLines={2}
              className="font-extrabold text-[20px] leading-[26px] text-text"
            >
              {subject}
            </Text>
            <Text className="font-regular text-[13px] text-text-secondary">
              {t('messages.with', { name: other.name })}
            </Text>
          </View>
        </View>
        {body}
        <Composer recipient={other.name} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

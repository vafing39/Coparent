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
import { ChevronLeftIcon, MessageIcon } from '../../components/icons';
import { ParentRing } from '../../features/custody/ParentRing';
import { parentOf } from '../../features/custody/parents';
import { Composer } from '../../features/messages/Composer';
import { MessageBubble } from '../../features/messages/MessageBubble';
import { MessageRow, messageRows } from '../../features/messages/messageRows';
import { useFamily } from '../../hooks/useFamily';
import { useMessages } from '../../hooks/useMessages';
import type { TabScreenProps } from '../../navigation/types';
import { useTheme } from '../../theme/ThemeProvider';

/**
 * Onglet Messages (cahier des charges, 7) : la conversation avec l'autre parent, en temps
 * réel. Un message envoyé n'est ni modifiable ni supprimable : aucune action ne le propose.
 * En mode solo, la messagerie attend l'arrivée de l'autre parent.
 */
export function MessagesScreen({ navigation }: TabScreenProps<'Messages'>) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const { family } = useFamily();
  const {
    messages,
    isLoadingMessages,
    messagesError,
    reloadMessages,
    hasOlderMessages,
    loadOlderMessages,
    isLoadingOlderMessages,
    markMessagesRead,
  } = useMessages();
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
    // Les onglets ne s'ouvrent qu'une fois la famille créée (SignedInNavigator).
    return null;
  }
  const otherRole: FamilyRole =
    family.myRole === 'PARENT_A' ? 'PARENT_B' : 'PARENT_A';
  const other = parentOf(family, otherRole);

  if (family.solo) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="border-b border-border px-4 pb-3 pt-7">
          <Text
            accessibilityRole="header"
            className="font-extrabold text-[24px] text-text"
          >
            {t('messages.title')}
          </Text>
        </View>
        <View className="flex-1 items-center justify-center gap-3.5 px-8">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
            <MessageIcon size={28} color={color('primary')} />
          </View>
          <Text className="text-center font-extrabold text-[20px] leading-[26px] text-text">
            {t('messages.solo.title', { name: other.name })}
          </Text>
          <Text className="text-center font-regular text-[15px] leading-[22px] text-text-secondary">
            {t('messages.solo.text')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
          {t('messages.empty', { name: other.name })}
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
    // Sans barre d'onglets (TabsNavigator) : la zone de saisie respecte le bas de l'écran.
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-row items-center gap-2 border-b border-border pb-3 pl-2 pr-4 pt-6">
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            className="h-12 w-12 items-center justify-center rounded-full"
          >
            <ChevronLeftIcon color={color('text')} />
          </Pressable>
          <ParentRing role={otherRole} initial={other.initial} />
          <View className="flex-1">
            <Text
              accessibilityRole="header"
              className="font-extrabold text-[20px] leading-[26px] text-text"
            >
              {other.name}
            </Text>
            <Text className="font-regular text-[13px] text-text-secondary">
              {t('messages.kept')}
            </Text>
          </View>
        </View>
        {body}
        <Composer recipient={other.name} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

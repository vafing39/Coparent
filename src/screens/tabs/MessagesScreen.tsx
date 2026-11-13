import React, { useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { FamilyRole } from '../../api/types';
import { LoadError } from '../../components/LoadError';
import { MessageIcon, PlusIcon } from '../../components/icons';
import { parentOf } from '../../features/custody/parents';
import { ConversationRow } from '../../features/messages/ConversationRow';
import { WelcomeRow } from '../../features/messages/WelcomeRow';
import { useFamily } from '../../hooks/useFamily';
import { useMessages } from '../../hooks/useMessages';
import type { TabScreenProps } from '../../navigation/types';
import { useTheme } from '../../theme/ThemeProvider';

/**
 * Onglet Messages (cahier des charges, 7) : les discussions avec l'autre parent, une par sujet
 * (écart voulu : une conversation unique devenait longue à parcourir). « + » en ouvre une
 * nouvelle ; une discussion s'ouvre en plein écran. La discussion « Bienvenue » de Coparent
 * reste épinglée en tête, quel que soit l'état de la liste. En mode solo, la messagerie attend
 * l'arrivée de l'autre parent.
 */
export function MessagesScreen({ navigation }: TabScreenProps<'Messages'>) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const { family } = useFamily();
  const {
    conversations,
    isLoadingConversations,
    conversationsError,
    reloadConversations,
  } = useMessages();
  const [refreshing, setRefreshing] = useState(false);

  if (!family) {
    // Les onglets ne s'ouvrent qu'une fois la famille créée (SignedInNavigator).
    return null;
  }
  const otherRole: FamilyRole =
    family.myRole === 'PARENT_A' ? 'PARENT_B' : 'PARENT_A';
  const other = parentOf(family, otherRole);
  const myId = family.members.find(m => m.role === family.myRole)?.userId;

  const header = (
    <View className="flex-row items-center justify-between border-b border-border px-4 pb-3 pt-7">
      <Text
        accessibilityRole="header"
        className="font-extrabold text-[24px] text-text"
      >
        {t('messages.title')}
      </Text>
      {family.solo ? null : (
        <Pressable
          onPress={() => navigation.navigate('NewConversation')}
          accessibilityRole="button"
          accessibilityLabel={t('messages.add')}
          className="h-11 w-11 items-center justify-center rounded-full bg-accent active:opacity-80"
        >
          <PlusIcon color={color('on-accent')} />
        </Pressable>
      )}
    </View>
  );

  if (family.solo) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        {header}
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

  const refresh = () => {
    setRefreshing(true);
    reloadConversations().finally(() => setRefreshing(false));
  };

  const welcome = <WelcomeRow onPress={() => navigation.navigate('Welcome')} />;

  let body: React.ReactNode;
  if (conversationsError && !conversations) {
    body = (
      <>
        <View className="px-4">{welcome}</View>
        <LoadError message={t('messages.listLoadFailed')} onRetry={refresh} />
      </>
    );
  } else if (isLoadingConversations || !conversations) {
    body = (
      <View className="px-4">
        {welcome}
        <View
          accessible
          accessibilityLabel={t('common.loading')}
          className="gap-3"
        >
          <View className="h-14 rounded-[16px] bg-surface" />
          <View className="h-14 rounded-[16px] bg-surface" />
          <View className="h-14 rounded-[16px] bg-surface" />
        </View>
      </View>
    );
  } else {
    // Jamais vide : « Bienvenue » est toujours là, au-dessus des discussions.
    body = (
      <ScrollView
        contentContainerClassName="px-4 pb-8"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={color('primary')}
          />
        }
      >
        {welcome}
        {conversations.map(conversation => (
          <ConversationRow
            key={conversation.id}
            conversation={conversation}
            myId={myId}
            divider
            onPress={() =>
              navigation.navigate('Conversation', {
                conversationId: conversation.id,
                subject: conversation.subject,
              })
            }
          />
        ))}
      </ScrollView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {header}
      {body}
    </SafeAreaView>
  );
}

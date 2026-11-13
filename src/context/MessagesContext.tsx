import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AppState } from 'react-native';
import {
  InfiniteData,
  QueryClient,
  UseMutateFunction,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { messageKeys } from '../api/messages';
import type {
  Conversation,
  CreateConversationBody,
  Message,
  MessagePage,
} from '../api/types';
import { useFamily } from '../hooks/useFamily';
import { subscribeFamilyMessages } from '../lib/realtime';

// Requêtes HTTP de la messagerie, appelées uniquement par MessagesProvider. Aucune route de
// modification ni de suppression : un message envoyé est définitif.

function conversationsPath(familyId: string) {
  return `/api/v1/families/${familyId}/conversations`;
}

async function fetchConversationsRequest(
  familyId: string,
): Promise<Conversation[]> {
  const { data } = await apiClient.get<Conversation[]>(
    conversationsPath(familyId),
  );
  return data;
}

async function createConversationRequest(
  familyId: string,
  body: CreateConversationBody,
): Promise<Conversation> {
  const { data } = await apiClient.post<Conversation>(
    conversationsPath(familyId),
    body,
  );
  return data;
}

async function fetchMessagesRequest(
  familyId: string,
  conversationId: string,
  before: number | undefined,
): Promise<MessagePage> {
  const query = before === undefined ? '' : `?before=${before}`;
  const { data } = await apiClient.get<MessagePage>(
    `${conversationsPath(familyId)}/${conversationId}/messages${query}`,
  );
  return data;
}

async function sendMessageRequest(
  familyId: string,
  conversationId: string,
  body: string,
): Promise<Message> {
  const { data } = await apiClient.post<Message>(
    `${conversationsPath(familyId)}/${conversationId}/messages`,
    { body },
  );
  return data;
}

async function markReadRequest(
  familyId: string,
  conversationId: string,
  upToSeq: number,
): Promise<void> {
  await apiClient.post(
    `${conversationsPath(familyId)}/${conversationId}/read`,
    { upToSeq },
  );
}

type Pages = InfiniteData<MessagePage, number | undefined>;

/** Ajoute un message à la page la plus récente de sa discussion, si elle est en cache (sans doublon). */
function addToCache(
  queryClient: QueryClient,
  familyId: string,
  message: Message,
) {
  queryClient.setQueryData<Pages>(
    messageKeys.conversation(familyId, message.conversationId),
    data => {
      if (!data || data.pages.length === 0) {
        return data;
      }
      if (
        data.pages.some(page => page.messages.some(m => m.id === message.id))
      ) {
        return data;
      }
      const [newest, ...older] = data.pages;
      const messages = [...newest.messages, message].sort(
        (a, b) => a.seq - b.seq,
      );
      return { ...data, pages: [{ ...newest, messages }, ...older] };
    },
  );
}

/** Pose `readAt` sur les messages non lus de la discussion jusqu'à `upToSeq` qui ne sont pas de `readerId`. */
function markReadInCache(
  queryClient: QueryClient,
  familyId: string,
  conversationId: string,
  readerId: string,
  upToSeq: number,
  readAt: string,
) {
  queryClient.setQueryData<Pages>(
    messageKeys.conversation(familyId, conversationId),
    data =>
      data
        ? {
            ...data,
            pages: data.pages.map(page => ({
              ...page,
              messages: page.messages.map(m =>
                m.seq <= upToSeq && m.readAt === null && m.senderId !== readerId
                  ? { ...m, readAt }
                  : m,
              ),
            })),
          }
        : data,
  );
}

export type MessagesContextValue = {
  /** Discussions, la plus récemment active d'abord ; undefined pendant le chargement, après une erreur ou en solo. */
  conversations: Conversation[] | undefined;
  isLoadingConversations: boolean;
  conversationsError: Error | null;
  reloadConversations: () => Promise<unknown>;
  createConversation: UseMutateFunction<
    Conversation,
    Error,
    CreateConversationBody
  >;
  isCreatingConversation: boolean;
  createConversationError: Error | null;
  resetCreateConversation: () => void;
  /** Discussion affichée (écran Conversation) : ses messages sont chargés et écrits ci-dessous. */
  openConversation: (conversationId: string) => void;
  closeConversation: () => void;
  /** Messages de la discussion ouverte, du plus ancien au plus récent. */
  messages: Message[] | undefined;
  isLoadingMessages: boolean;
  messagesError: Error | null;
  reloadMessages: () => void;
  hasOlderMessages: boolean;
  loadOlderMessages: () => void;
  isLoadingOlderMessages: boolean;
  sendMessage: UseMutateFunction<Message, Error, string>;
  isSendingMessage: boolean;
  sendMessageError: Error | null;
  resetSendMessage: () => void;
  /** Les messages de l'autre parent dans la discussion ouverte, jusqu'à ce seq, sont lus. */
  markMessagesRead: UseMutateFunction<void, Error, number>;
};

export const MessagesContext = createContext<MessagesContextValue | null>(null);

/**
 * Messagerie entre parents, rangée en discussions par sujet : liste des discussions, création,
 * messages de la discussion ouverte (par pages), envoi, lecture, et temps réel (nouveaux
 * messages, « Lu ») tant que l'app est au premier plan. Fermée en mode solo. Placé sous
 * FamilyProvider.
 */
export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { family } = useFamily();
  const familyId = family?.id ?? '';
  const open = familyId !== '' && family?.solo === false;
  const myId = family?.members.find(m => m.role === family.myRole)?.userId;
  const [activeId, setActiveId] = useState<string | null>(null);

  const refreshConversations = useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: messageKeys.conversations(familyId),
      }),
    [queryClient, familyId],
  );

  const {
    data: conversations,
    isPending: isPendingConversations,
    error: conversationsError,
    refetch: refetchConversations,
  } = useQuery({
    queryKey: messageKeys.conversations(familyId),
    queryFn: () => fetchConversationsRequest(familyId),
    enabled: open,
  });

  const {
    mutate: createConversation,
    isPending: isCreatingConversation,
    error: createConversationError,
    reset: resetCreateConversation,
  } = useMutation({
    mutationFn: (body: CreateConversationBody) =>
      createConversationRequest(familyId, body),
    onSuccess: (conversation: Conversation) => {
      queryClient.setQueryData<Conversation[]>(
        messageKeys.conversations(familyId),
        list => [
          conversation,
          ...(list ?? []).filter(c => c.id !== conversation.id),
        ],
      );
    },
  });

  const {
    data,
    isPending,
    error: messagesError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: messageKeys.conversation(familyId, activeId ?? ''),
    queryFn: ({ pageParam }) =>
      fetchMessagesRequest(familyId, activeId ?? '', pageParam),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: lastPage =>
      lastPage.hasMore && lastPage.messages.length > 0
        ? lastPage.messages[0].seq
        : undefined,
    enabled: open && activeId !== null,
  });

  const {
    mutate: sendMessage,
    isPending: isSendingMessage,
    error: sendMessageError,
    reset: resetSendMessage,
  } = useMutation({
    mutationFn: (body: string) =>
      sendMessageRequest(familyId, activeId ?? '', body),
    onSuccess: (message: Message) => {
      addToCache(queryClient, familyId, message);
      refreshConversations();
    },
  });

  const { mutate: markMessagesRead } = useMutation({
    mutationFn: (upToSeq: number) =>
      markReadRequest(familyId, activeId ?? '', upToSeq),
    onSuccess: (_result, upToSeq) => {
      if (myId && activeId) {
        markReadInCache(
          queryClient,
          familyId,
          activeId,
          myId,
          upToSeq,
          new Date().toISOString(),
        );
      }
      refreshConversations();
    },
  });

  // Temps réel, seulement au premier plan : en revenant, la reconnexion recharge la messagerie.
  const [active, setActive] = useState(AppState.currentState !== 'background');
  useEffect(() => {
    const listener = AppState.addEventListener('change', state =>
      setActive(state === 'active'),
    );
    return () => listener.remove();
  }, []);
  useEffect(() => {
    if (!open || !active) {
      return;
    }
    const subscription = subscribeFamilyMessages(
      familyId,
      event => {
        if (event.type === 'MESSAGE') {
          addToCache(queryClient, familyId, event.message);
        } else {
          markReadInCache(
            queryClient,
            familyId,
            event.conversationId,
            event.readerId,
            event.upToSeq,
            event.readAt,
          );
        }
        refreshConversations();
      },
      () => {
        queryClient.invalidateQueries({
          queryKey: messageKeys.all(familyId),
        });
      },
    );
    return () => subscription.close();
  }, [open, active, familyId, queryClient, refreshConversations]);

  const messages = useMemo(
    () =>
      data
        ? [...data.pages].reverse().flatMap(page => page.messages)
        : undefined,
    [data],
  );

  const value = useMemo<MessagesContextValue>(
    () => ({
      conversations,
      isLoadingConversations: open && isPendingConversations,
      conversationsError,
      reloadConversations: () => refetchConversations(),
      createConversation,
      isCreatingConversation,
      createConversationError,
      resetCreateConversation,
      openConversation: setActiveId,
      closeConversation: () => setActiveId(null),
      messages,
      isLoadingMessages: open && activeId !== null && isPending,
      messagesError,
      reloadMessages: () => {
        refetch();
      },
      hasOlderMessages: hasNextPage,
      loadOlderMessages: () => {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      isLoadingOlderMessages: isFetchingNextPage,
      sendMessage,
      isSendingMessage,
      sendMessageError,
      resetSendMessage,
      markMessagesRead,
    }),
    [
      conversations,
      open,
      isPendingConversations,
      conversationsError,
      refetchConversations,
      createConversation,
      isCreatingConversation,
      createConversationError,
      resetCreateConversation,
      messages,
      activeId,
      isPending,
      messagesError,
      refetch,
      hasNextPage,
      fetchNextPage,
      isFetchingNextPage,
      sendMessage,
      isSendingMessage,
      sendMessageError,
      resetSendMessage,
      markMessagesRead,
    ],
  );
  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  );
}

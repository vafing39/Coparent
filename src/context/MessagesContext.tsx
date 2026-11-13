import React, { createContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import {
  InfiniteData,
  QueryClient,
  UseMutateFunction,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { messageKeys } from '../api/messages';
import type { Message, MessagePage } from '../api/types';
import { useFamily } from '../hooks/useFamily';
import { subscribeFamilyMessages } from '../lib/realtime';

// Requêtes HTTP de la messagerie, appelées uniquement par MessagesProvider. Aucune route de
// modification ni de suppression : un message envoyé est définitif.

function messagesPath(familyId: string) {
  return `/api/v1/families/${familyId}/messages`;
}

async function fetchMessagesRequest(
  familyId: string,
  before: number | undefined,
): Promise<MessagePage> {
  const query = before === undefined ? '' : `?before=${before}`;
  const { data } = await apiClient.get<MessagePage>(
    `${messagesPath(familyId)}${query}`,
  );
  return data;
}

async function sendMessageRequest(
  familyId: string,
  body: string,
): Promise<Message> {
  const { data } = await apiClient.post<Message>(messagesPath(familyId), {
    body,
  });
  return data;
}

async function markReadRequest(
  familyId: string,
  upToSeq: number,
): Promise<void> {
  await apiClient.post(`${messagesPath(familyId)}/read`, { upToSeq });
}

type Pages = InfiniteData<MessagePage, number | undefined>;

/** Ajoute un message à la page la plus récente du cache (sans doublon). */
function addToCache(
  queryClient: QueryClient,
  familyId: string,
  message: Message,
) {
  queryClient.setQueryData<Pages>(messageKeys.list(familyId), data => {
    if (!data || data.pages.length === 0) {
      return data;
    }
    if (data.pages.some(page => page.messages.some(m => m.id === message.id))) {
      return data;
    }
    const [newest, ...older] = data.pages;
    const messages = [...newest.messages, message].sort(
      (a, b) => a.seq - b.seq,
    );
    return { ...data, pages: [{ ...newest, messages }, ...older] };
  });
}

/** Pose `readAt` sur les messages non lus jusqu'à `upToSeq` qui ne sont pas de `readerId`. */
function markReadInCache(
  queryClient: QueryClient,
  familyId: string,
  readerId: string,
  upToSeq: number,
  readAt: string,
) {
  queryClient.setQueryData<Pages>(messageKeys.list(familyId), data =>
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
  /** Du plus ancien au plus récent ; undefined pendant le chargement, après une erreur ou en solo. */
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
  /** Les messages de l'autre parent jusqu'à ce seq sont lus. */
  markMessagesRead: UseMutateFunction<void, Error, number>;
};

export const MessagesContext = createContext<MessagesContextValue | null>(null);

/**
 * Messagerie entre parents : charge la conversation par pages, envoie, signale la lecture et
 * écoute le temps réel (nouveaux messages, « Lu ») tant que l'app est au premier plan. Fermée
 * en mode solo (l'autre parent n'a pas rejoint). Placé sous FamilyProvider.
 */
export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { family } = useFamily();
  const familyId = family?.id ?? '';
  const open = familyId !== '' && family?.solo === false;
  const myId = family?.members.find(m => m.role === family.myRole)?.userId;

  const {
    data,
    isPending,
    error,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: messageKeys.list(familyId),
    queryFn: ({ pageParam }) => fetchMessagesRequest(familyId, pageParam),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: lastPage =>
      lastPage.hasMore && lastPage.messages.length > 0
        ? lastPage.messages[0].seq
        : undefined,
    enabled: open,
  });

  const {
    mutate: sendMessage,
    isPending: isSendingMessage,
    error: sendMessageError,
    reset: resetSendMessage,
  } = useMutation({
    mutationFn: (body: string) => sendMessageRequest(familyId, body),
    onSuccess: (message: Message) => addToCache(queryClient, familyId, message),
  });

  const { mutate: markMessagesRead } = useMutation({
    mutationFn: (upToSeq: number) => markReadRequest(familyId, upToSeq),
    onSuccess: (_result, upToSeq) => {
      if (myId) {
        markReadInCache(
          queryClient,
          familyId,
          myId,
          upToSeq,
          new Date().toISOString(),
        );
      }
    },
  });

  // Temps réel, seulement au premier plan : en revenant, la reconnexion recharge la conversation.
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
            event.readerId,
            event.upToSeq,
            event.readAt,
          );
        }
      },
      () => {
        queryClient.invalidateQueries({ queryKey: messageKeys.list(familyId) });
      },
    );
    return () => subscription.close();
  }, [open, active, familyId, queryClient]);

  const messages = useMemo(
    () =>
      data
        ? [...data.pages].reverse().flatMap(page => page.messages)
        : undefined,
    [data],
  );

  const value = useMemo<MessagesContextValue>(
    () => ({
      messages,
      isLoadingMessages: open && isPending,
      messagesError: error,
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
      messages,
      open,
      isPending,
      error,
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

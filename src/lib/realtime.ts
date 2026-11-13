import './textCodec';
import { Client } from '@stomp/stompjs';
import { refreshSession } from '../api/session';
import type { MessageRealtimeEvent } from '../api/types';
import { useSession } from '../stores/session';
import { API_URL } from './config';

/** « http://hôte:8080 » → « ws://hôte:8080/ws » (wss en https). */
export function realtimeUrl(apiUrl: string = API_URL): string {
  return `${apiUrl.replace(/^http/, 'ws').replace(/\/$/, '')}/ws`;
}

export type RealtimeSubscription = { close: () => void };

/**
 * Écoute en temps réel la messagerie de la famille (STOMP sur WebSocket). Le jeton d'accès est
 * relu à chaque (re)connexion ; s'il est refusé, il est renouvelé avant la tentative suivante.
 * `onReconnect` est appelé à chaque reconnexion après la première, pour rattraper les messages
 * arrivés pendant la coupure.
 */
export function subscribeFamilyMessages(
  familyId: string,
  onEvent: (event: MessageRealtimeEvent) => void,
  onReconnect: () => void,
): RealtimeSubscription {
  let connectedOnce = false;
  const client = new Client({
    brokerURL: realtimeUrl(),
    reconnectDelay: 5000,
    heartbeatIncoming: 20000,
    heartbeatOutgoing: 20000,
    // Contournements recommandés pour le WebSocket de React Native.
    forceBinaryWSFrames: true,
    appendMissingNULLonIncoming: true,
    beforeConnect: stompClient => {
      const token = useSession.getState().accessToken;
      stompClient.connectHeaders = token
        ? { Authorization: `Bearer ${token}` }
        : {};
    },
    onConnect: () => {
      client.subscribe(`/topic/families/${familyId}/messages`, frame => {
        try {
          onEvent(JSON.parse(frame.body) as MessageRealtimeEvent);
        } catch {
          // Trame illisible : ignorée, le prochain rechargement rattrape.
        }
      });
      if (connectedOnce) {
        onReconnect();
      }
      connectedOnce = true;
    },
    onStompError: () => {
      // Jeton expiré ou refusé : renouvelé pour la prochaine tentative.
      refreshSession();
    },
  });
  client.activate();
  return {
    close: () => {
      client.deactivate();
    },
  };
}

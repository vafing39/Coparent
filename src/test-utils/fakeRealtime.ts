import type { MessageRealtimeEvent } from '../api/types';
import type { RealtimeSubscription } from '../lib/realtime';

// Remplace src/lib/realtime dans les tests :
// jest.mock('<chemin>/lib/realtime', () => jest.requireActual('<chemin>/test-utils/fakeRealtime'))
// Les tests émettent eux-mêmes les événements avec `realtime.emit`.

type Listener = {
  familyId: string;
  onEvent: (event: MessageRealtimeEvent) => void;
  onReconnect: () => void;
};

const listeners = new Set<Listener>();

export const realtime = {
  /** Familles écoutées en ce moment. */
  subscribedFamilies: () => [...listeners].map(l => l.familyId),
  emit: (event: MessageRealtimeEvent) =>
    listeners.forEach(l => l.onEvent(event)),
  reconnect: () => listeners.forEach(l => l.onReconnect()),
};

export function realtimeUrl(apiUrl: string): string {
  return `${apiUrl.replace(/^http/, 'ws')}/ws`;
}

export function subscribeFamilyMessages(
  familyId: string,
  onEvent: (event: MessageRealtimeEvent) => void,
  onReconnect: () => void,
): RealtimeSubscription {
  const listener = { familyId, onEvent, onReconnect };
  listeners.add(listener);
  return { close: () => listeners.delete(listener) };
}

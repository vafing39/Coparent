import { useContext } from 'react';
import {
  MessagesContext,
  MessagesContextValue,
} from '../context/MessagesContext';

/** Messagerie entre parents, détenue par MessagesProvider. */
export function useMessages(): MessagesContextValue {
  const value = useContext(MessagesContext);
  if (!value) {
    throw new Error('useMessages doit être utilisé dans un MessagesProvider.');
  }
  return value;
}

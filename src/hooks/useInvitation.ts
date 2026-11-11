import { useContext } from 'react';
import {
  InvitationContext,
  InvitationContextValue,
} from '../context/InvitationContext';

/** Invitation reçue par lien (côté invité) : aperçu, acceptation, choix de l'invité. */
export function useInvitation(): InvitationContextValue {
  const value = useContext(InvitationContext);
  if (!value) {
    throw new Error(
      'useInvitation doit être utilisé dans un InvitationProvider.',
    );
  }
  return value;
}

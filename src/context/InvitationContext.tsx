import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Linking } from 'react-native';
import {
  UseMutateFunction,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { familyKeys } from '../api/family';
import { invitationKeys } from '../api/invitation';
import type { Family, InvitationPreview } from '../api/types';
import { parseInvitationToken } from '../lib/invitationLink';
import {
  clearInvitation,
  loadInvitation,
  saveInvitation,
  StoredInvitation,
} from '../lib/tokenStorage';

// Requêtes HTTP de l'invitation (côté invité), appelées uniquement par InvitationProvider.

const INVITATIONS_PATH = '/api/v1/invitations';

/** Aperçu public : qui invite, les enfants (prénom, âge) et le rythme proposé. */
async function fetchPreviewRequest(token: string): Promise<InvitationPreview> {
  const { data } = await apiClient.get<InvitationPreview>(
    `${INVITATIONS_PATH}/${encodeURIComponent(token)}`,
  );
  return data;
}

/** L'utilisateur connecté (email vérifié) rejoint la famille comme second parent. */
async function acceptRequest(token: string): Promise<Family> {
  const { data } = await apiClient.post<Family>(
    `${INVITATIONS_PATH}/${encodeURIComponent(token)}/accept`,
  );
  return data;
}

export type InvitationContextValue = {
  /** Lecture du trousseau au démarrage : on ne sait pas encore s'il y a une invitation. */
  isRestoringInvitation: boolean;
  /** Invitation reçue par lien, en attente d'acceptation (null : aucune). */
  pendingInvitation: StoredInvitation | null;
  /** L'invité choisit de rejoindre (aperçu vu) : l'acceptation sera automatique une fois connecté. */
  confirmInvitation: () => void;
  /** Oublie l'invitation (ignorée, acceptée ou plus valide). */
  dismissInvitation: () => void;

  /** Aperçu de l'invitation en attente. */
  preview: InvitationPreview | undefined;
  isLoadingPreview: boolean;
  previewError: Error | null;
  reloadPreview: () => void;

  /** Accepte l'invitation en attente ; en cas de succès, la famille est en cache. */
  acceptInvitation: UseMutateFunction<Family, Error, void>;
  isAcceptingInvitation: boolean;
  acceptInvitationError: Error | null;
  resetAcceptInvitation: () => void;
};

export const InvitationContext = createContext<InvitationContextValue | null>(
  null,
);

/**
 * Invitation de l'autre parent, côté invité : reçoit les liens qui ouvrent l'app, garde
 * le jeton dans le trousseau jusqu'à l'acceptation, et détient l'aperçu et l'acceptation.
 */
export function InvitationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const [isRestoringInvitation, setRestoring] = useState(true);
  const [pendingInvitation, setPending] = useState<StoredInvitation | null>(
    null,
  );

  const store = useCallback((invitation: StoredInvitation | null) => {
    setPending(invitation);
    (invitation ? saveInvitation(invitation) : clearInvitation()).catch(
      () => undefined, // trousseau indisponible : l'invitation reste pour cette session
    );
  }, []);

  const receiveUrl = useCallback(
    (url: string | null) => {
      const token = url ? parseInvitationToken(url) : null;
      if (token) {
        // Un nouveau lien remplace l'invitation en attente.
        store({ token, confirmed: false });
      }
    },
    [store],
  );

  useEffect(() => {
    let cancelled = false;
    // Invitation gardée d'une session précédente, puis lien qui a ouvert l'app (prioritaire).
    loadInvitation()
      .catch(() => null)
      .then(saved => {
        if (!cancelled && saved) {
          setPending(saved);
        }
        return Linking.getInitialURL().catch(() => null);
      })
      .then(url => {
        if (!cancelled) {
          receiveUrl(url ?? null);
          setRestoring(false);
        }
      });
    const subscription = Linking.addEventListener('url', ({ url }) =>
      receiveUrl(url),
    );
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [receiveUrl]);

  const token = pendingInvitation?.token ?? null;

  const confirmInvitation = useCallback(() => {
    if (token) {
      store({ token, confirmed: true });
    }
  }, [store, token]);
  const dismissInvitation = useCallback(() => store(null), [store]);

  const previewQuery = useQuery({
    queryKey: invitationKeys.preview(token ?? ''),
    queryFn: () => fetchPreviewRequest(token as string),
    enabled: token !== null,
  });

  const {
    mutate: acceptInvitation,
    isPending: isAcceptingInvitation,
    error: acceptInvitationError,
    reset: resetAcceptInvitation,
  } = useMutation({
    mutationFn: () => {
      if (!token) {
        throw new Error('Aucune invitation en attente.');
      }
      return acceptRequest(token);
    },
    onSuccess: family => queryClient.setQueryData(familyKeys.mine, family),
  });

  const { refetch } = previewQuery;
  const reloadPreview = useCallback(() => {
    refetch();
  }, [refetch]);

  const value = useMemo<InvitationContextValue>(
    () => ({
      isRestoringInvitation,
      pendingInvitation,
      confirmInvitation,
      dismissInvitation,
      preview: previewQuery.data,
      isLoadingPreview: previewQuery.isPending && token !== null,
      previewError: previewQuery.error,
      reloadPreview,
      acceptInvitation,
      isAcceptingInvitation,
      acceptInvitationError,
      resetAcceptInvitation,
    }),
    [
      isRestoringInvitation,
      pendingInvitation,
      confirmInvitation,
      dismissInvitation,
      previewQuery.data,
      previewQuery.isPending,
      previewQuery.error,
      token,
      reloadPreview,
      acceptInvitation,
      isAcceptingInvitation,
      acceptInvitationError,
      resetAcceptInvitation,
    ],
  );
  return (
    <InvitationContext.Provider value={value}>
      {children}
    </InvitationContext.Provider>
  );
}

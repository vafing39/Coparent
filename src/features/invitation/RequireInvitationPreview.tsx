import React from 'react';
import { useTranslation } from 'react-i18next';
import { LoadError } from '../../components/LoadError';
import { ScreenSkeleton } from '../../components/ScreenSkeleton';
import { isInvitationInvalid } from '../../api/invitation';
import type { InvitationPreview } from '../../api/types';
import { useInvitation } from '../../hooks/useInvitation';

type Props = {
  children: (preview: InvitationPreview) => React.ReactNode;
};

/**
 * Charge l'aperçu de l'invitation en attente : squelette, lien plus valide (on continue
 * sans invitation), erreur réseau (Réessayer), puis l'aperçu.
 */
export function RequireInvitationPreview({ children }: Props) {
  const { t } = useTranslation();
  const {
    preview,
    isLoadingPreview,
    previewError,
    reloadPreview,
    dismissInvitation,
  } = useInvitation();

  if (preview) {
    return <>{children(preview)}</>;
  }
  if (isLoadingPreview || !previewError) {
    return <ScreenSkeleton />;
  }
  if (isInvitationInvalid(previewError)) {
    return (
      <LoadError
        message={t('invitation.invalid')}
        actionLabel={t('invitation.continueWithout')}
        onRetry={dismissInvitation}
      />
    );
  }
  return (
    <LoadError message={t('invitation.loadFailed')} onRetry={reloadPreview} />
  );
}

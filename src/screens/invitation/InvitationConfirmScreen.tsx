import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { InvitationPreviewView } from '../../features/invitation/InvitationPreviewView';
import { RequireInvitationPreview } from '../../features/invitation/RequireInvitationPreview';
import { useInvitation } from '../../hooks/useInvitation';

/** Lien ouvert en étant déjà connecté (sans famille) : aperçu, puis « Rejoindre la famille ». */
export function InvitationConfirmScreen() {
  const { t } = useTranslation();
  const { confirmInvitation, dismissInvitation } = useInvitation();
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <RequireInvitationPreview>
        {preview => (
          <InvitationPreviewView
            preview={preview}
            onIgnore={dismissInvitation}
            actions={
              <Button
                label={t('invitation.preview.join')}
                onPress={confirmInvitation}
              />
            }
          />
        )}
      </RequireInvitationPreview>
    </SafeAreaView>
  );
}

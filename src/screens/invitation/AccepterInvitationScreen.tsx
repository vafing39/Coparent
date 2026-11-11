import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { InvitationPreviewView } from '../../features/invitation/InvitationPreviewView';
import { RequireInvitationPreview } from '../../features/invitation/RequireInvitationPreview';
import { useInvitation } from '../../hooks/useInvitation';
import type { AuthScreenProps } from '../../navigation/types';

/**
 * Lien d'invitation ouvert sans être connecté : aperçu, puis inscription ou connexion.
 * Une fois connecté (email vérifié), l'invitation est acceptée automatiquement.
 */
export function AccepterInvitationScreen({
  navigation,
}: AuthScreenProps<'AccepterInvitation'>) {
  const { t } = useTranslation();
  const { confirmInvitation, dismissInvitation } = useInvitation();

  const join = (next: 'Inscription' | 'ConnexionEmail') => {
    confirmInvitation();
    navigation.navigate(next);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <RequireInvitationPreview>
        {preview => (
          <InvitationPreviewView
            preview={preview}
            onIgnore={dismissInvitation}
            actions={
              <>
                <Button
                  label={t('invitation.preview.signup')}
                  onPress={() => join('Inscription')}
                />
                <Button
                  label={t('invitation.preview.login')}
                  variant="neutral"
                  compact
                  onPress={() => join('ConnexionEmail')}
                />
              </>
            }
          />
        )}
      </RequireInvitationPreview>
    </SafeAreaView>
  );
}

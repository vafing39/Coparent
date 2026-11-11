import React from 'react';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { useInvitation } from '../../hooks/useInvitation';

/** Lien ouvert par un utilisateur qui a déjà une famille : une seule famille par utilisateur. */
export function InvitationBlockedScreen() {
  const { t } = useTranslation();
  const { dismissInvitation } = useInvitation();
  return (
    <SafeAreaView
      className="flex-1 justify-center gap-5 bg-background px-6"
      edges={['top', 'bottom']}
    >
      <Text
        accessibilityRole="alert"
        className="font-regular text-[15px] leading-[22px] text-text"
      >
        {t('invitation.alreadyInFamily')}
      </Text>
      <Button label={t('invitation.continue')} onPress={dismissInvitation} />
    </SafeAreaView>
  );
}

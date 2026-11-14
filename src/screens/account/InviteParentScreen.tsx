import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackHeader } from '../../components/BackHeader';
import { InfoIcon } from '../../components/icons';
import { InvitationForm } from '../../features/invitation/InvitationForm';
import { invitationStatus } from '../../features/invitation/invitationStatus';
import { useFamily } from '../../hooks/useFamily';
import type { AppScreenProps } from '../../navigation/types';
import { useTheme } from '../../theme/ThemeProvider';

/**
 * Mode solo (cahier des charges, 3) : où en est l'invitation, puis un nouveau lien à partager ou
 * à copier (il remplace le précédent : seul son hash est gardé par le serveur).
 */
export function InviteParentScreen({
  navigation,
}: AppScreenProps<'InviterParent'>) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const { family } = useFamily();

  if (!family) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <BackHeader
        title={t('invite.title')}
        onBack={() => navigation.goBack()}
      />
      <InvitationForm
        family={family}
        variant="resend"
        onDone={() => navigation.goBack()}
        intro={
          <View className="gap-3">
            <Text className="font-regular text-[15px] leading-[21px] text-text-secondary">
              {t('onboarding.invitation.subtitle')}
            </Text>
            {family.invitation ? (
              <View
                accessible
                className="flex-row gap-2 rounded-2xl border border-border bg-card px-4 py-3.5"
              >
                <InfoIcon size={16} color={color('pending')} />
                <Text className="flex-1 font-bold text-[15px] leading-[21px] text-text">
                  {invitationStatus(family.invitation)}
                </Text>
              </View>
            ) : null}
          </View>
        }
      />
    </SafeAreaView>
  );
}

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { FamilyRole, PendingInvitation } from '../../api/types';
import { DASHED, SOFT } from '../custody/parentColors';
import { invitationStatus } from '../invitation/invitationStatus';

type Props = {
  /** Rôle de l'autre parent, pas encore arrivé. */
  otherRole: FamilyRole;
  /** Dernier lien envoyé, s'il y en a un. */
  invitation: PendingInvitation | null;
  /** Ouvre « Inviter l'autre parent ». */
  onInvite: () => void;
};

/** Mode solo : l'autre parent n'a pas encore rejoint la famille ; où en est l'invitation. */
export function SoloBanner({ otherRole, invitation, onInvite }: Props) {
  const { t } = useTranslation();
  return (
    <View
      className={`gap-3 rounded-[20px] border-2 border-dashed bg-card p-4 ${DASHED[otherRole]}`}
    >
      <View className="flex-row items-center gap-3">
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className={`h-10 w-10 items-center justify-center rounded-full border-2 border-dashed ${SOFT[otherRole]}`}
        >
          <Text className="font-extrabold text-[15px] text-text">?</Text>
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="font-bold text-[15px] leading-[21px] text-text">
            {t('home.solo')}
          </Text>
          {invitation ? (
            <Text className="font-regular text-[13px] leading-[18px] text-text-secondary">
              {invitationStatus(invitation)}
            </Text>
          ) : null}
        </View>
      </View>
      <Pressable
        onPress={onInvite}
        accessibilityRole="button"
        className="min-h-[44px] items-center justify-center rounded-full border-[1.5px] border-primary bg-surface px-4 active:opacity-80"
      >
        <Text className="font-extrabold text-[15px] text-primary">
          {t(invitation ? 'invite.resend' : 'invite.title')}
        </Text>
      </Pressable>
    </View>
  );
}

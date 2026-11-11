import React, { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { ApiError } from '../../api/errors';
import { acceptInvitationErrorMessage } from '../../api/invitation';
import { useInvitation } from '../../hooks/useInvitation';
import { useResetOnUnmount } from '../../hooks/useResetOnUnmount';
import { useTheme } from '../../theme/ThemeProvider';

type Props = {
  /** La famille est rejointe (et en cache) : on entre dans l'app. */
  onJoined: () => void;
};

/**
 * Invitation confirmée et email vérifié : l'invitation est acceptée sans autre action.
 * En cas de refus, la cause, puis on continue sans invitation.
 */
export function JoinFamilyScreen({ onJoined }: Props) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const {
    acceptInvitation,
    acceptInvitationError,
    resetAcceptInvitation,
    dismissInvitation,
  } = useInvitation();
  useResetOnUnmount(resetAcceptInvitation);

  const join = useCallback(
    () =>
      acceptInvitation(undefined, {
        onSuccess: () => {
          onJoined();
          dismissInvitation();
        },
      }),
    [acceptInvitation, onJoined, dismissInvitation],
  );

  // Une seule tentative automatique (les effets peuvent être rejoués en développement).
  const started = useRef(false);
  useEffect(() => {
    if (!started.current) {
      started.current = true;
      join();
    }
  }, [join]);

  if (acceptInvitationError) {
    const network =
      !(acceptInvitationError instanceof ApiError) ||
      acceptInvitationError.status === null;
    return (
      <SafeAreaView
        className="flex-1 justify-center gap-5 bg-background px-6"
        edges={['top', 'bottom']}
      >
        <Text
          accessibilityRole="alert"
          className="font-regular text-[15px] leading-[22px] text-text"
        >
          {acceptInvitationErrorMessage(acceptInvitationError)}
        </Text>
        {network ? (
          <View className="gap-2.5">
            <Button label={t('common.retry')} onPress={join} />
            <Button
              label={t('invitation.continueWithout')}
              variant="neutral"
              compact
              onPress={dismissInvitation}
            />
          </View>
        ) : (
          <Button
            label={t('invitation.continue')}
            onPress={dismissInvitation}
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={t('invitation.joining')}
      className="flex-1 items-center justify-center gap-4 bg-background px-6"
    >
      <ActivityIndicator size="large" color={color('primary')} />
      <Text className="text-center font-bold text-[17px] text-text">
        {t('invitation.joining')}
      </Text>
    </View>
  );
}

import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { CheckIcon } from '../../components/icons';
import { useTheme } from '../../theme/ThemeProvider';

/** Mot de passe oublié, fin : mot de passe modifié, retour à la connexion. */
export function DoneStep({ onSignIn }: { onSignIn: () => void }) {
  const { t } = useTranslation();
  const { color } = useTheme();
  return (
    <>
      <View
        accessibilityLiveRegion="polite"
        className="flex-row items-center gap-2 rounded-md bg-surface px-3.5 py-3"
      >
        <CheckIcon color={color('validated')} />
        <Text className="flex-1 font-bold text-[15px] leading-[22px] text-text">
          {t('forgotPassword.done')}
        </Text>
      </View>
      <View className="mt-auto">
        <Button label={t('forgotPassword.signIn')} onPress={onSignIn} />
      </View>
    </>
  );
}

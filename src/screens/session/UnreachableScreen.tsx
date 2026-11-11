import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { useAuth } from '../../hooks/useAuth';

/** Session enregistrée, mais le serveur n'a pas répondu au démarrage. */
export function UnreachableScreen() {
  const { t } = useTranslation();
  const { restore, isRestoring, signOut } = useAuth();

  return (
    <SafeAreaView
      className="flex-1 justify-center bg-background px-6"
      edges={['top', 'bottom']}
    >
      <View className="gap-3">
        <Text
          accessibilityRole="header"
          className="font-extrabold text-[22px] leading-[28px] text-text"
        >
          {t('session.unreachable.title')}
        </Text>
        <Text className="font-regular text-[15px] leading-[22px] text-text-secondary">
          {t('session.unreachable.body')}
        </Text>
      </View>
      <View className="mt-8 gap-2.5">
        <Button
          label={t('common.retry')}
          onPress={() => restore()}
          loading={isRestoring}
        />
        <Button
          label={t('common.signOut')}
          variant="secondary"
          onPress={() => signOut()}
        />
      </View>
    </SafeAreaView>
  );
}

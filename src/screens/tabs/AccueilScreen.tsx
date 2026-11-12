import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { useAuth } from '../../hooks/useAuth';

/**
 * Onglet Accueil. PROVISOIRE : salutation et déconnexion, en attendant le contenu
 * (ce soir, prochain passage, aujourd'hui, à traiter) et l'écran « Compte et famille ».
 */
export function AccueilScreen() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const firstName = user?.firstName;

  return (
    <SafeAreaView
      className="flex-1 justify-center bg-background px-6"
      edges={['top']}
    >
      <View className="gap-2">
        <Text
          accessibilityRole="header"
          className="font-extrabold text-[28px] leading-[34px] text-text"
        >
          {t('home.greeting', { firstName })}
        </Text>
        <Text className="font-regular text-[15px] leading-[22px] text-text-secondary">
          {t('home.placeholder')}
        </Text>
      </View>
      <View className="mt-8">
        <Button
          label={t('common.signOut')}
          variant="secondary"
          onPress={() => signOut()}
        />
      </View>
    </SafeAreaView>
  );
}

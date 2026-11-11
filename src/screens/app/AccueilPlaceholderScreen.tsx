import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { useSession } from '../../stores/session';

/**
 * PROVISOIRE : écran affiché une fois connecté, en attendant les 5 onglets
 * (Accueil, Calendrier, Messages, Famille, Dépenses).
 */
export function AccueilPlaceholderScreen() {
  const firstName = useSession(state => state.user?.firstName);
  const signOut = useSession(state => state.signOut);

  return (
    <SafeAreaView
      className="flex-1 justify-center bg-background px-6"
      edges={['bottom']}
    >
      <View className="gap-2">
        <Text
          accessibilityRole="header"
          className="font-extrabold text-[28px] leading-[34px] text-text"
        >
          Bonjour {firstName}
        </Text>
        <Text className="font-regular text-[15px] leading-[22px] text-text-secondary">
          Vous êtes connecté. Les onglets arrivent bientôt.
        </Text>
      </View>
      <View className="mt-8">
        <Button
          label="Se déconnecter"
          variant="secondary"
          onPress={() => signOut()}
        />
      </View>
    </SafeAreaView>
  );
}

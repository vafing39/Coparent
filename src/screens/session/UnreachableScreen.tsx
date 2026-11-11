import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { useSession } from '../../stores/session';

/** Session enregistrée, mais le serveur n'a pas répondu au démarrage. */
export function UnreachableScreen() {
  const restore = useSession(state => state.restore);
  const signOut = useSession(state => state.signOut);

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
          Connexion impossible
        </Text>
        <Text className="font-regular text-[15px] leading-[22px] text-text-secondary">
          Le service ne répond pas. Vérifiez votre accès à Internet, puis
          réessayez.
        </Text>
      </View>
      <View className="mt-8 gap-2.5">
        <Button label="Réessayer" onPress={() => restore()} />
        <Button
          label="Se déconnecter"
          variant="secondary"
          onPress={() => signOut()}
        />
      </View>
    </SafeAreaView>
  );
}

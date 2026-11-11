import React from 'react';
import { Linking, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { TextLink } from '../../components/TextLink';
import { APP_NAME, PRIVACY_URL, TERMS_URL } from '../../lib/app';
import type { AuthScreenProps } from '../../navigation/types';

/** Logo provisoire : un repère par parent autour d'un disque commun. Décoratif. */
function Logo() {
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      className="flex-row items-center gap-1.5"
    >
      <View className="h-2.5 w-2.5 rounded-full bg-parent-a" />
      <View className="h-14 w-14 rounded-full bg-primary-soft" />
      <View className="h-2.5 w-2.5 rounded-full bg-parent-b" />
    </View>
  );
}

export function BienvenueScreen({ navigation }: AuthScreenProps<'Bienvenue'>) {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <ScrollView
        contentContainerClassName="grow px-6 pt-12 pb-8 gap-5"
        bounces={false}
      >
        <View className="items-start gap-4">
          <Logo />
          <Text className="font-extrabold text-2xl text-text">{APP_NAME}</Text>
          <Text
            accessibilityRole="header"
            className="font-extrabold text-[30px] leading-9 text-text"
          >
            Organisez la garde, échangez sereinement.
          </Text>
          <Text className="font-regular text-[15px] leading-[22px] text-text-secondary">
            Un seul espace pour le calendrier, les messages et les dépenses des
            enfants. Neutre pour les deux parents.
          </Text>
        </View>

        <View className="mt-auto gap-2.5">
          <Button
            label="Créer mon compte"
            onPress={() => navigation.navigate('Inscription')}
          />
          <Button
            label="Accéder à mon espace"
            variant="secondary"
            accessibilityHint="Se connecter à un compte existant"
            onPress={() => navigation.navigate('ConnexionEmail')}
          />
        </View>

        <Text className="font-regular text-[13px] leading-[18px] text-text-secondary text-center">
          En continuant, vous acceptez les{' '}
          <TextLink onPress={() => Linking.openURL(TERMS_URL)}>
            conditions d'utilisation
          </TextLink>{' '}
          et la{' '}
          <TextLink onPress={() => Linking.openURL(PRIVACY_URL)}>
            politique de confidentialité
          </TextLink>
          .
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

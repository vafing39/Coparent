import React from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { FamilyRole } from '../../api/types';
import { BackHeader } from '../../components/BackHeader';
import { Button } from '../../components/Button';
import { ChevronRightIcon } from '../../components/icons';
import { ParentRing } from '../../features/custody/ParentRing';
import { parentOf } from '../../features/custody/parents';
import { useAuth } from '../../hooks/useAuth';
import { useFamily } from '../../hooks/useFamily';
import type { AppScreenProps } from '../../navigation/types';
import { useTheme } from '../../theme/ThemeProvider';

/**
 * « Compte et famille » (cahier des charges, 12), ouvert par l'avatar de l'accueil : la famille,
 * les réglages de ce téléphone et la déconnexion. Le compte (mot de passe, données, suppression)
 * viendra ensuite.
 */
export function CompteFamilleScreen({
  navigation,
}: AppScreenProps<'CompteFamille'>) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const { signOut } = useAuth();
  const { family } = useFamily();

  if (!family) {
    return null;
  }
  const otherRole: FamilyRole =
    family.myRole === 'PARENT_A' ? 'PARENT_B' : 'PARENT_A';
  const me = parentOf(family, family.myRole);
  const other = parentOf(family, otherRole);

  const confirmSignOut = () =>
    Alert.alert(t('account.signOut.title'), t('account.signOut.body'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.signOut'),
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <BackHeader
        title={t('account.title')}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerClassName="gap-5 px-4 pt-2 pb-8">
        <View
          accessible
          className="flex-row items-center gap-3.5 rounded-[20px] border border-border bg-card p-4"
        >
          <View className="flex-row">
            <ParentRing role={family.myRole} initial={me.initial} />
            <View className="-ml-2.5">
              <ParentRing role={otherRole} initial={other.initial} />
            </View>
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="font-extrabold text-[17px] text-text">
              {family.name}
            </Text>
            <Text className="font-regular text-[13px] text-text-secondary">
              {family.solo
                ? t('account.family.solo', { other: other.name })
                : t('account.family.with', { me: me.name, other: other.name })}
            </Text>
          </View>
        </View>

        <View className="gap-1.5">
          <Text
            accessibilityRole="header"
            className="mx-1 font-bold text-[13px] text-text-secondary"
          >
            {t('account.myPhone')}
          </Text>
          <Pressable
            onPress={() => navigation.navigate('Reglages')}
            accessibilityRole="button"
            accessibilityHint={t('account.settingsHint')}
            className="min-h-[56px] flex-row items-center justify-between rounded-[20px] border border-border bg-card px-4 active:opacity-80"
          >
            <Text className="font-bold text-[15px] text-text">
              {t('settings.title')}
            </Text>
            <ChevronRightIcon color={color('text-secondary')} />
          </Pressable>
        </View>

        <Text className="mx-1 font-regular text-[13px] leading-[19px] text-text-secondary">
          {t('account.familyTabNote')}
        </Text>

        <Button
          label={t('common.signOut')}
          variant="neutral"
          onPress={confirmSignOut}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

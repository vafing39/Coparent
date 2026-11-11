import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { InfoIcon } from '../../components/icons';
import { OnboardingHeader } from '../../components/OnboardingHeader';
import { RadioCard } from '../../components/RadioCard';
import { TextField } from '../../components/TextField';
import {
  familyErrorMessage,
  useMyFamily,
  useSaveFamily,
} from '../../api/family';
import type { Family } from '../../api/types';
import {
  familySchema,
  FamilyInput,
  FamilyValues,
  VACATION_ZONES,
} from '../../schemas/family';
import type { OnboardingScreenProps } from '../../navigation/types';
import { ZonesInfoSheet } from '../../features/family/ZonesInfoSheet';
import { useTheme } from '../../theme/ThemeProvider';

type Navigation = OnboardingScreenProps<'Famille'>['navigation'];

/**
 * Étape 2 de la première connexion : nom de la famille et zone de vacances scolaires.
 * Pas de flèche de retour : l'email est déjà vérifié, l'étape 1 n'a plus lieu d'être.
 * Les étapes suivantes ont une flèche qui revient à l'étape précédente (OnboardingHeader).
 *
 * Si la famille existe déjà (retour depuis l'étape 3, reprise de la première connexion),
 * le formulaire est prérempli et l'enregistrement la modifie au lieu d'en créer une autre.
 */
export function FamilleScreen({
  navigation,
}: OnboardingScreenProps<'Famille'>) {
  const myFamily = useMyFamily();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {/* Pas de retour : une fois l'email vérifié, l'étape 2 est la première. */}
      <OnboardingHeader step={2} />

      {myFamily.isPending ? (
        <FamilySkeleton />
      ) : myFamily.isError ? (
        <LoadError onRetry={() => myFamily.refetch()} />
      ) : (
        // Pas de famille (null) : formulaire vide, c'est l'état « vide » de l'écran.
        <FamilyForm existing={myFamily.data} navigation={navigation} />
      )}
    </SafeAreaView>
  );
}

function FamilyForm({
  existing,
  navigation,
}: {
  existing: Family | null;
  navigation: Navigation;
}) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const save = useSaveFamily();
  const [zonesInfoOpen, setZonesInfoOpen] = useState(false);
  const { control, handleSubmit } = useForm<FamilyInput, unknown, FamilyValues>(
    {
      resolver: zodResolver(familySchema),
      defaultValues: existing
        ? { name: existing.name, zone: existing.vacationZone }
        : { name: '' },
    },
  );

  const onSubmit = handleSubmit(values =>
    save.mutate(
      { existing, values },
      { onSuccess: () => navigation.navigate('Enfants') },
    ),
  );
  const submit = () => {
    if (!save.isPending) {
      onSubmit();
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerClassName="grow px-6 pt-6 pb-8 gap-5"
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-1.5">
          <Text
            accessibilityRole="header"
            className="font-extrabold text-[28px] leading-[34px] text-text"
          >
            {t('onboarding.family.title')}
          </Text>
          <Text className="font-regular text-[15px] leading-[21px] text-text-secondary">
            {t('onboarding.family.subtitle')}
          </Text>
        </View>

        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <TextField
              ref={field.ref}
              label={t('onboarding.family.name.label')}
              placeholder={t('onboarding.family.name.placeholder')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              autoCapitalize="words"
              returnKeyType="done"
            />
          )}
        />

        <Controller
          control={control}
          name="zone"
          render={({ field, fieldState }) => (
            <View className="gap-2">
              <View className="mb-1 flex-row items-center gap-2">
                <View className="flex-1 gap-1">
                  <Text className="font-bold text-[13px] text-text">
                    {t('onboarding.family.zone.legend')}
                  </Text>
                  <Text className="font-regular text-[13px] text-text-secondary">
                    {t('onboarding.family.zone.help')}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setZonesInfoOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel={t('onboarding.family.zone.infoButton')}
                  className="h-11 w-11 items-center justify-center rounded-full active:opacity-60"
                >
                  <InfoIcon color={color('primary')} />
                </Pressable>
              </View>
              <View
                accessibilityRole="radiogroup"
                accessibilityLabel={t('onboarding.family.zone.legend')}
                className="gap-2"
              >
                {VACATION_ZONES.map(zone => (
                  <RadioCard
                    key={zone}
                    label={t(`onboarding.family.zone.options.${zone}.label`)}
                    hint={t(`onboarding.family.zone.options.${zone}.hint`)}
                    checked={field.value === zone}
                    onPress={() => field.onChange(zone)}
                  />
                ))}
              </View>
              {fieldState.error ? (
                <ErrorText text={fieldState.error.message} />
              ) : null}
            </View>
          )}
        />

        <View className="mt-auto gap-3">
          {save.isError ? (
            <ErrorText text={familyErrorMessage(save.error)} />
          ) : null}
          <Button
            label={t('onboarding.family.continue')}
            onPress={submit}
            loading={save.isPending}
          />
        </View>
      </ScrollView>

      <ZonesInfoSheet
        visible={zonesInfoOpen}
        onClose={() => setZonesInfoOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}

function ErrorText({ text }: { text?: string }) {
  return (
    <Text
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className="font-semibold text-[13px] leading-[18px] text-error"
    >
      {text}
    </Text>
  );
}

/** Chargement : la forme de l'écran, sans contenu. */
function FamilySkeleton() {
  const { t } = useTranslation();
  return (
    <View
      accessible
      accessibilityLabel={t('common.loading')}
      className="flex-1 gap-5 px-6 pt-6"
    >
      <View className="gap-2">
        <View className="h-[34px] w-3/4 rounded-md bg-surface" />
        <View className="h-[21px] w-full rounded-md bg-surface" />
      </View>
      <View className="h-[52px] rounded-md bg-surface" />
      {VACATION_ZONES.map(zone => (
        <View key={zone} className="h-[56px] rounded-md bg-surface" />
      ))}
    </View>
  );
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <View className="flex-1 justify-center gap-5 px-6">
      <Text
        accessibilityRole="alert"
        className="font-regular text-[15px] leading-[22px] text-text"
      >
        {t('onboarding.family.loadFailed')}
      </Text>
      <Button label={t('common.retry')} onPress={onRetry} />
    </View>
  );
}

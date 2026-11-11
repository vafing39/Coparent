import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { ErrorText } from '../../components/ErrorText';
import { InfoIcon } from '../../components/icons';
import { RadioCard } from '../../components/RadioCard';
import { TextField } from '../../components/TextField';
import { familyErrorMessage } from '../../api/family';
import { useFamily } from '../../hooks/useFamily';
import { useResetOnUnmount } from '../../hooks/useResetOnUnmount';
import {
  familySchema,
  FamilyInput,
  FamilyValues,
  VACATION_ZONES,
} from '../../schemas/family';
import { useTheme } from '../../theme/ThemeProvider';
import { ZonesInfoSheet } from './ZonesInfoSheet';

type Props = {
  /** Appelé une fois la famille enregistrée sur le serveur. */
  onSaved: () => void;
};

/**
 * Formulaire de la famille : nom et zone de vacances scolaires. Prérempli si la famille
 * existe déjà (enregistrement en modification).
 */
export function FamilyForm({ onSaved }: Props) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const {
    family: existing,
    saveFamily,
    isSavingFamily,
    saveFamilyError,
    resetSaveFamily,
  } = useFamily();
  useResetOnUnmount(resetSaveFamily);
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
    saveFamily(values, { onSuccess: onSaved }),
  );
  const submit = () => {
    if (!isSavingFamily) {
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
          {saveFamilyError ? (
            <ErrorText text={familyErrorMessage(saveFamilyError)} />
          ) : null}
          <Button
            label={t('onboarding.family.continue')}
            onPress={submit}
            loading={isSavingFamily}
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

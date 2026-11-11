import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Controller } from 'react-hook-form';
import type { Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { TextField } from '../../components/TextField';
import { CloseIcon } from '../../components/icons';
import { formatDateInput } from '../../lib/dates';
import type { ChildrenInput, ChildrenValues } from '../../schemas/children';
import { useTheme } from '../../theme/ThemeProvider';

type Props = {
  control: Control<ChildrenInput, unknown, ChildrenValues>;
  /** Position dans le formulaire (0 pour « Enfant 1 »). */
  index: number;
  /** Absent quand c'est le dernier enfant : il en faut au moins un. */
  onRemove?: () => void;
};

/** Carte d'un enfant : prénom et date de naissance (saisie « jj/mm/aaaa »). */
export function ChildCard({ control, index, onRemove }: Props) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const number = index + 1;

  return (
    <View className="gap-3 rounded-2xl border-2 border-border bg-card p-4">
      <View className="min-h-[44px] flex-row items-center justify-between">
        <Text className="font-extrabold text-[15px] text-text">
          {t('onboarding.children.childTitle', { number })}
        </Text>
        {onRemove ? (
          <Pressable
            onPress={onRemove}
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.children.remove', { number })}
            className="h-11 w-11 items-center justify-center rounded-full active:opacity-60"
          >
            <CloseIcon color={color('text-secondary')} />
          </Pressable>
        ) : null}
      </View>

      <Controller
        control={control}
        name={`children.${index}.firstName`}
        render={({ field, fieldState }) => (
          <TextField
            ref={field.ref}
            label={t('onboarding.children.firstName.label')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            autoCapitalize="words"
            returnKeyType="next"
          />
        )}
      />

      <Controller
        control={control}
        name={`children.${index}.birthDate`}
        render={({ field, fieldState }) => (
          <TextField
            ref={field.ref}
            label={t('onboarding.children.birthDate.label')}
            placeholder={t('onboarding.children.birthDate.placeholder')}
            hint={t('onboarding.children.birthDate.hint')}
            value={field.value}
            onChangeText={text => field.onChange(formatDateInput(text))}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            keyboardType="number-pad"
            maxLength={10}
            returnKeyType="done"
          />
        )}
      />
    </View>
  );
}

import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { ErrorText } from '../../components/ErrorText';
import { PlusIcon } from '../../components/icons';
import { childrenErrorMessage } from '../../api/family';
import { useFamily } from '../../hooks/useFamily';
import { useResetOnUnmount } from '../../hooks/useResetOnUnmount';
import type { Family } from '../../api/types';
import { toDisplayDate } from '../../lib/dates';
import {
  childrenSchema,
  ChildrenInput,
  ChildrenValues,
} from '../../schemas/children';
import { useTheme } from '../../theme/ThemeProvider';
import { ChildCard } from './ChildCard';

const EMPTY_CHILD = { firstName: '', birthDate: '' };

type Props = {
  family: Family;
  /** Appelé une fois les enfants enregistrés sur le serveur. */
  onSaved: () => void;
};

/**
 * Formulaire des enfants : une carte par enfant, ajout et retrait.
 * Rien n'est envoyé avant « Continuer » ; les enfants déjà enregistrés sont préremplis.
 */
export function ChildrenForm({ family, onSaved }: Props) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const {
    saveChildren,
    isSavingChildren,
    saveChildrenError,
    resetSaveChildren,
  } = useFamily();
  useResetOnUnmount(resetSaveChildren);
  const { control, handleSubmit, setValue } = useForm<
    ChildrenInput,
    unknown,
    ChildrenValues
  >({
    resolver: zodResolver(childrenSchema),
    defaultValues: {
      children:
        family.children.length > 0
          ? family.children.map(child => ({
              childId: child.id,
              firstName: child.firstName,
              birthDate: toDisplayDate(child.birthDate),
            }))
          : [EMPTY_CHILD],
    },
  });
  // keyName : la clé interne de React Hook Form ne doit pas écraser childId.
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'children',
    keyName: 'key',
  });

  const onSubmit = handleSubmit(values =>
    saveChildren(
      {
        children: values.children,
        onCreated: (index, child) =>
          setValue(`children.${index}.childId`, child.id),
      },
      { onSuccess: onSaved },
    ),
  );
  const submit = () => {
    if (!isSavingChildren) {
      onSubmit();
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerClassName="grow px-6 pt-6 pb-8 gap-4"
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-1.5">
          <Text
            accessibilityRole="header"
            className="font-extrabold text-[28px] leading-[34px] text-text"
          >
            {t('onboarding.children.title')}
          </Text>
          <Text className="font-regular text-[15px] leading-[21px] text-text-secondary">
            {t('onboarding.children.subtitle')}
          </Text>
        </View>

        {fields.map((field, index) => (
          <ChildCard
            key={field.key}
            control={control}
            index={index}
            onRemove={fields.length > 1 ? () => remove(index) : undefined}
          />
        ))}

        <Pressable
          onPress={() => append(EMPTY_CHILD)}
          accessibilityRole="button"
          className="min-h-[52px] flex-row items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-text-secondary active:opacity-70"
        >
          <PlusIcon color={color('text')} />
          <Text className="font-bold text-[15px] text-text">
            {t('onboarding.children.add')}
          </Text>
        </Pressable>

        <View className="mt-auto gap-3 pt-2">
          {saveChildrenError ? (
            <ErrorText text={childrenErrorMessage(saveChildrenError)} />
          ) : null}
          <Button
            label={t('onboarding.children.continue')}
            onPress={submit}
            loading={isSavingChildren}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

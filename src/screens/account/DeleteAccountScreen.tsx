import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { describeDeleteAccountError } from '../../api/account';
import { BackHeader } from '../../components/BackHeader';
import { Button } from '../../components/Button';
import { ErrorText } from '../../components/ErrorText';
import { TextField } from '../../components/TextField';
import { useAccount } from '../../hooks/useAccount';
import { useResetOnUnmount } from '../../hooks/useResetOnUnmount';
import type { AppScreenProps } from '../../navigation/types';
import {
  DeleteAccountInput,
  DeleteAccountValues,
  deleteAccountSchema,
} from '../../schemas/account';

const CONSEQUENCES = ['signOut', 'data', 'messages', 'family'] as const;

/**
 * « Supprimer mon compte » (cahier des charges, 1) : ce qui se passe, le mot de passe pour
 * confirmer, puis une dernière confirmation. En cas de succès, la session est fermée.
 */
export function DeleteAccountScreen({
  navigation,
}: AppScreenProps<'SupprimerCompte'>) {
  const { t } = useTranslation();
  const { deleteAccount, isDeletingAccount, resetDeleteAccount } = useAccount();
  useResetOnUnmount(resetDeleteAccount);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const { control, handleSubmit, setError } = useForm<
    DeleteAccountInput,
    unknown,
    DeleteAccountValues
  >({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { password: '' },
  });

  const onSubmit = handleSubmit(({ password }) =>
    Alert.alert(
      t('account.delete.confirm.title'),
      t('account.delete.confirm.body'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('account.delete.confirm.ok'),
          style: 'destructive',
          onPress: () => {
            setGeneralError(null);
            deleteAccount(password, {
              onError: error => {
                const { field, message } = describeDeleteAccountError(error);
                if (field) {
                  setError(field, { message }, { shouldFocus: true });
                } else {
                  setGeneralError(message);
                }
              },
            });
          },
        },
      ],
    ),
  );
  const submit = () => {
    onSubmit();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <BackHeader
        title={t('account.delete.title')}
        onBack={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerClassName="grow gap-4 px-4 pt-2 pb-8"
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-2 rounded-[20px] border border-border bg-card p-4">
            <Text className="font-bold text-[15px] leading-[21px] text-text">
              {t('account.delete.intro')}
            </Text>
            {CONSEQUENCES.map(item => (
              <Text
                key={item}
                className="font-regular text-[15px] leading-[21px] text-text"
              >
                {`• ${t(`account.delete.consequences.${item}`)}`}
              </Text>
            ))}
          </View>
          <Text className="mx-1 font-regular text-[13px] leading-[19px] text-text-secondary">
            {t('account.delete.subscription')}
          </Text>

          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <TextField
                ref={field.ref}
                label={t('fields.password.label')}
                hint={t('account.delete.passwordHint')}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={submit}
              />
            )}
          />

          <View className="mt-auto gap-2.5">
            {generalError ? <ErrorText text={generalError} /> : null}
            <Button
              label={t('account.delete.submit')}
              variant="neutral"
              onPress={submit}
              loading={isDeletingAccount}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

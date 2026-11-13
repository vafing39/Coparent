import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInputInstance,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { describeChangePasswordError } from '../../api/account';
import { BackHeader } from '../../components/BackHeader';
import { Button } from '../../components/Button';
import { ErrorText } from '../../components/ErrorText';
import { CheckIcon } from '../../components/icons';
import { TextField } from '../../components/TextField';
import { useAccount } from '../../hooks/useAccount';
import { useResetOnUnmount } from '../../hooks/useResetOnUnmount';
import type { AppScreenProps } from '../../navigation/types';
import {
  ChangePasswordInput,
  ChangePasswordValues,
  changePasswordSchema,
} from '../../schemas/account';
import { PASSWORD_MIN_LENGTH } from '../../schemas/auth';
import { useTheme } from '../../theme/ThemeProvider';

/**
 * « Modifier le mot de passe » (cahier des charges, 1) : l'actuel, puis le nouveau deux fois.
 * Les autres appareils sont déconnectés ; ce téléphone reçoit une nouvelle session.
 */
export function ChangePasswordScreen({
  navigation,
}: AppScreenProps<'ModifierMotDePasse'>) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const newRef = useRef<TextInputInstance>(null);
  const confirmRef = useRef<TextInputInstance>(null);
  const { changePassword, isChangingPassword, resetChangePassword } =
    useAccount();
  useResetOnUnmount(resetChangePassword);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const { control, handleSubmit, setError } = useForm<
    ChangePasswordInput,
    unknown,
    ChangePasswordValues
  >({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = handleSubmit(values => {
    setGeneralError(null);
    changePassword(values, {
      onSuccess: () => setDone(true),
      onError: error => {
        const { field, message } = describeChangePasswordError(error);
        if (field) {
          setError(field, { message }, { shouldFocus: true });
        } else {
          setGeneralError(message);
        }
      },
    });
  });
  const submit = () => {
    onSubmit();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <BackHeader
        title={t('account.password.title')}
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
          {done ? (
            <>
              <View
                accessibilityLiveRegion="polite"
                className="flex-row items-center gap-2 rounded-2xl bg-surface px-4 py-3.5"
              >
                <CheckIcon color={color('validated')} />
                <Text className="flex-1 font-bold text-[15px] leading-[21px] text-text">
                  {t('account.password.done')}
                </Text>
              </View>
              <View className="mt-auto">
                <Button
                  label={t('account.password.back')}
                  onPress={() => navigation.goBack()}
                />
              </View>
            </>
          ) : (
            <>
              <View className="gap-3.5">
                <Controller
                  control={control}
                  name="currentPassword"
                  render={({ field, fieldState }) => (
                    <TextField
                      ref={field.ref}
                      label={t('account.password.current.label')}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      error={fieldState.error?.message}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="current-password"
                      textContentType="password"
                      returnKeyType="next"
                      submitBehavior="submit"
                      onSubmitEditing={() => newRef.current?.focus()}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="newPassword"
                  render={({ field, fieldState }) => (
                    <TextField
                      ref={el => {
                        field.ref(el);
                        newRef.current = el;
                      }}
                      label={t('account.password.new')}
                      hint={t('fields.password.minLength', {
                        min: PASSWORD_MIN_LENGTH,
                      })}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      error={fieldState.error?.message}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="new-password"
                      textContentType="newPassword"
                      returnKeyType="next"
                      submitBehavior="submit"
                      onSubmitEditing={() => confirmRef.current?.focus()}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field, fieldState }) => (
                    <TextField
                      ref={el => {
                        field.ref(el);
                        confirmRef.current = el;
                      }}
                      label={t('fields.confirmPassword.label')}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      error={fieldState.error?.message}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="new-password"
                      textContentType="newPassword"
                      returnKeyType="go"
                      onSubmitEditing={submit}
                    />
                  )}
                />
              </View>
              <View className="mt-auto gap-2.5">
                {generalError ? <ErrorText text={generalError} /> : null}
                <Button
                  label={t('account.password.submit')}
                  onPress={submit}
                  loading={isChangingPassword}
                />
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

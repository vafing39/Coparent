import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../components/Button';
import { ErrorText } from '../../components/ErrorText';
import { TextField } from '../../components/TextField';
import { forgotPasswordErrorMessage } from '../../api/auth';
import { useAuth } from '../../hooks/useAuth';
import {
  ForgotPasswordInput,
  ForgotPasswordValues,
  forgotPasswordSchema,
} from '../../schemas/auth';

/** Mot de passe oublié, étape 1 : l'adresse du compte, puis envoi du code. */
export function EmailStep({
  defaultEmail,
  onSent,
}: {
  defaultEmail: string;
  onSent: (email: string) => void;
}) {
  const { t } = useTranslation();
  const { forgotPassword, isSendingResetCode, forgotPasswordError } = useAuth();
  const { control, handleSubmit } = useForm<
    ForgotPasswordInput,
    unknown,
    ForgotPasswordValues
  >({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: defaultEmail },
  });

  const onSubmit = handleSubmit(({ email }) =>
    forgotPassword(email, { onSuccess: () => onSent(email) }),
  );
  const submit = () => {
    onSubmit();
  };

  return (
    <>
      <Text className="font-regular text-[15px] leading-[22px] text-text">
        {t('forgotPassword.body')}
      </Text>
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <TextField
            ref={field.ref}
            label={t('fields.email.label')}
            placeholder={t('fields.email.placeholder')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="username"
            returnKeyType="send"
            onSubmitEditing={submit}
          />
        )}
      />
      <View className="mt-auto gap-[18px]">
        {forgotPasswordError ? (
          <ErrorText text={forgotPasswordErrorMessage(forgotPasswordError)} />
        ) : null}
        <Button
          label={t('forgotPassword.sendCode')}
          onPress={submit}
          loading={isSendingResetCode}
        />
      </View>
    </>
  );
}

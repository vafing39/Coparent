import React, { useRef, useState } from 'react';
import { Pressable, Text, TextInputInstance, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../components/Button';
import { ErrorText } from '../../components/ErrorText';
import { TextField } from '../../components/TextField';
import { CheckIcon } from '../../components/icons';
import {
  describeResetPasswordError,
  forgotPasswordErrorMessage,
} from '../../api/auth';
import { useAuth } from '../../hooks/useAuth';
import {
  PASSWORD_MIN_LENGTH,
  RESET_CODE_LENGTH,
  ResetPasswordFormInput,
  ResetPasswordFormValues,
  resetPasswordFormSchema,
} from '../../schemas/auth';
import { useTheme } from '../../theme/ThemeProvider';

/**
 * Mot de passe oublié, étape 2 : code reçu par email et nouveau mot de passe. Permet aussi
 * de renvoyer le code ou de revenir à l'adresse.
 */
export function CodeStep({
  email,
  onChangeAddress,
  onDone,
}: {
  email: string;
  onChangeAddress: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const passwordRef = useRef<TextInputInstance>(null);
  const confirmRef = useRef<TextInputInstance>(null);
  const {
    resetPassword,
    isResettingPassword,
    forgotPassword,
    isSendingResetCode,
    forgotPasswordError,
  } = useAuth();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const { control, handleSubmit, setError } = useForm<
    ResetPasswordFormInput,
    unknown,
    ResetPasswordFormValues
  >({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { code: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(values => {
    setGeneralError(null);
    resetPassword(
      { email, ...values },
      {
        onSuccess: onDone,
        onError: error => {
          const { field, message } = describeResetPasswordError(error);
          if (field) {
            setError(field, { message }, { shouldFocus: true });
          } else {
            setGeneralError(message);
          }
        },
      },
    );
  });
  const submit = () => {
    onSubmit();
  };

  const onResend = () => {
    setResent(false);
    forgotPassword(email, { onSuccess: () => setResent(true) });
  };

  return (
    <>
      <Text className="font-regular text-[15px] leading-[22px] text-text">
        <Trans
          i18nKey="forgotPassword.codeSent"
          values={{ email }}
          components={{ bold: <Text className="font-extrabold" /> }}
        />
      </Text>

      <View className="gap-3.5">
        <Controller
          control={control}
          name="code"
          render={({ field, fieldState }) => (
            <TextField
              ref={field.ref}
              label={t('forgotPassword.code.label')}
              value={field.value}
              // Accepte un code collé avec un espace (« 4829 1375 ») : on ne garde que les chiffres.
              onChangeText={text =>
                field.onChange(
                  text.replace(/\D/g, '').slice(0, RESET_CODE_LENGTH),
                )
              }
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              autoCorrect={false}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => passwordRef.current?.focus()}
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
                passwordRef.current = el;
              }}
              label={t('forgotPassword.newPassword')}
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

      {resent ? (
        <View
          accessibilityLiveRegion="polite"
          className="flex-row items-center gap-1.5 rounded-md bg-surface px-3.5 py-2.5"
        >
          <CheckIcon color={color('validated')} />
          <Text className="flex-1 font-bold text-[13px] leading-[18px] text-validated">
            {t('forgotPassword.resent')}
          </Text>
        </View>
      ) : null}

      <View className="mt-auto gap-2.5">
        {generalError ? <ErrorText text={generalError} /> : null}
        {forgotPasswordError ? (
          <ErrorText text={forgotPasswordErrorMessage(forgotPasswordError)} />
        ) : null}
        <Button
          label={t('forgotPassword.submit')}
          onPress={submit}
          loading={isResettingPassword}
        />
        <Button
          label={t('forgotPassword.resend')}
          variant="neutral"
          onPress={onResend}
          loading={isSendingResetCode}
        />
        <Pressable
          onPress={onChangeAddress}
          accessibilityRole="button"
          className="min-h-[44px] items-center justify-center"
        >
          <Text className="font-bold text-[15px] text-primary">
            {t('forgotPassword.changeAddress')}
          </Text>
        </Pressable>
      </View>
    </>
  );
}

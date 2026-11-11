import React, { useRef } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInputInstance,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trans, useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { TextLink } from '../../components/TextLink';
import { describeSignupError } from '../../api/auth';
import { useAuth } from '../../hooks/useAuth';
import { useResetOnUnmount } from '../../hooks/useResetOnUnmount';
import { PRIVACY_URL, TERMS_URL } from '../../lib/app';
import {
  PASSWORD_MIN_LENGTH,
  signupSchema,
  SignupInput,
  SignupValues,
} from '../../schemas/auth';
import type { AuthScreenProps } from '../../navigation/types';

export function InscriptionScreen({
  navigation,
}: AuthScreenProps<'Inscription'>) {
  const { t } = useTranslation();
  const firstNameRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);
  const confirmRef = useRef<TextInputInstance>(null);
  const { signup, isSigningUp, signupError, resetSignup } = useAuth();
  useResetOnUnmount(resetSignup);

  const { control, handleSubmit, setError } = useForm<
    SignupInput,
    unknown,
    SignupValues
  >({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      firstName: '',
      password: '',
      confirmPassword: '',
    },
  });

  // En cas de succès, la session s'ouvre et la navigation passe à la vérification de l'email.
  const onSubmit = handleSubmit(values =>
    signup(values, {
      onError: error => {
        const { field, message } = describeSignupError(error);
        if (field) {
          setError(field, { message }, { shouldFocus: true });
        }
      },
    }),
  );
  const submit = () => {
    onSubmit();
  };

  const generalError =
    signupError && describeSignupError(signupError).field === null
      ? describeSignupError(signupError).message
      : null;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerClassName="grow px-6 pt-2 pb-8 gap-[18px]"
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-1.5">
            <Text
              accessibilityRole="header"
              className="font-extrabold text-[28px] leading-[34px] text-text"
            >
              {t('signup.title')}
            </Text>
            <Text className="font-regular text-[15px] leading-[21px] text-text-secondary">
              {t('signup.subtitle')}
            </Text>
          </View>

          <View className="gap-3.5">
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
                  textContentType="emailAddress"
                  returnKeyType="next"
                  submitBehavior="submit"
                  onSubmitEditing={() => firstNameRef.current?.focus()}
                />
              )}
            />
            <Controller
              control={control}
              name="firstName"
              render={({ field, fieldState }) => (
                <TextField
                  ref={el => {
                    field.ref(el);
                    firstNameRef.current = el;
                  }}
                  label={t('fields.firstName.label')}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  autoCapitalize="words"
                  autoComplete="given-name"
                  textContentType="givenName"
                  returnKeyType="next"
                  submitBehavior="submit"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field, fieldState }) => (
                <TextField
                  ref={el => {
                    field.ref(el);
                    passwordRef.current = el;
                  }}
                  label={t('fields.password.label')}
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

          <View className="mt-auto gap-[18px]">
            {generalError ? (
              <Text
                accessibilityRole="alert"
                accessibilityLiveRegion="assertive"
                className="font-semibold text-[15px] leading-[22px] text-error"
              >
                {generalError}
              </Text>
            ) : null}

            <Button
              label={t('signup.submit')}
              onPress={submit}
              loading={isSigningUp}
            />

            <View className="flex-row flex-wrap items-center justify-center">
              <Text className="font-regular text-[15px] text-text">
                {t('signup.haveAccount')}{' '}
              </Text>
              <Pressable
                onPress={() => navigation.navigate('ConnexionEmail')}
                accessibilityRole="link"
                className="min-h-[44px] justify-center"
              >
                <Text className="font-extrabold text-[15px] text-primary">
                  {t('signup.signIn')}
                </Text>
              </Pressable>
            </View>

            <Text className="font-regular text-[13px] leading-[18px] text-text-secondary text-center">
              <Trans
                i18nKey="legal.acceptOnSignup"
                components={{
                  terms: (
                    <TextLink onPress={() => Linking.openURL(TERMS_URL)} />
                  ),
                  privacy: (
                    <TextLink onPress={() => Linking.openURL(PRIVACY_URL)} />
                  ),
                }}
              />
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

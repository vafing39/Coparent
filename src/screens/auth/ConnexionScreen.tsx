import React, { useRef } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInputInstance,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { AppleIcon } from '../../components/icons';
import { loginErrorMessage, useLogin } from '../../api/auth';
import { loginSchema, LoginInput, LoginValues } from '../../schemas/auth';
import type { AuthScreenProps } from '../../navigation/types';

function OrDivider() {
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      className="flex-row items-center gap-3"
    >
      <View className="h-px flex-1 bg-border" />
      <Text className="font-bold text-[13px] text-text-secondary">ou</Text>
      <View className="h-px flex-1 bg-border" />
    </View>
  );
}

const renderAppleIcon = (color: string) => <AppleIcon color={color} />;
const renderGoogleIcon = () => (
  <Text className="font-extrabold text-[17px] text-text">G</Text>
);

// PROVISOIRE : Apple et Google demandent leurs SDK et identifiants (fonction à venir).
function socialLoginUnavailable(provider: string) {
  Alert.alert(
    'Bientôt disponible',
    `La connexion avec ${provider} sera disponible prochainement.`,
  );
}

export function ConnexionScreen({
  navigation,
}: AuthScreenProps<'ConnexionEmail'>) {
  const passwordRef = useRef<TextInputInstance>(null);
  const loginMutation = useLogin();

  const { control, handleSubmit } = useForm<LoginInput, unknown, LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // En cas de succès, la session s'ouvre et la navigation bascule vers l'app.
  const onSubmit = handleSubmit(values => loginMutation.mutate(values));
  const submit = () => {
    onSubmit();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerClassName="grow px-6 pt-2 pb-8 gap-4"
          keyboardShouldPersistTaps="handled"
        >
          <Text
            accessibilityRole="header"
            className="font-extrabold text-[28px] leading-[34px] text-text"
          >
            Accéder à mon espace
          </Text>

          <View className="gap-3.5">
            <Controller
              control={control}
              name="email"
              render={({ field, fieldState }) => (
                <TextField
                  ref={field.ref}
                  label="Adresse email"
                  placeholder="vous@exemple.fr"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="username"
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
                  label="Mot de passe"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="current-password"
                  textContentType="password"
                  returnKeyType="go"
                  onSubmitEditing={submit}
                />
              )}
            />

            <Pressable
              onPress={() => navigation.navigate('MotDePasse')}
              accessibilityRole="link"
              className="min-h-[44px] justify-center self-end"
            >
              <Text className="font-bold text-[15px] text-primary">
                Mot de passe oublié ?
              </Text>
            </Pressable>

            {loginMutation.isError ? (
              <Text
                accessibilityRole="alert"
                accessibilityLiveRegion="assertive"
                className="font-semibold text-[15px] leading-[22px] text-error"
              >
                {loginErrorMessage(loginMutation.error)}
              </Text>
            ) : null}

            <Button
              label="Se connecter"
              onPress={submit}
              loading={loginMutation.isPending}
            />
          </View>

          <OrDivider />

          <View className="flex-row gap-2.5">
            <View className="flex-1">
              <Button
                label="Apple"
                accessibilityLabel="Continuer avec Apple"
                variant="inverse"
                compact
                icon={renderAppleIcon}
                onPress={() => socialLoginUnavailable('Apple')}
              />
            </View>
            <View className="flex-1">
              <Button
                label="Google"
                accessibilityLabel="Continuer avec Google"
                variant="neutral"
                compact
                icon={renderGoogleIcon}
                onPress={() => socialLoginUnavailable('Google')}
              />
            </View>
          </View>

          <View className="mt-auto flex-row flex-wrap items-center justify-center">
            <Text className="font-regular text-[15px] text-text">
              Pas encore de compte ?{' '}
            </Text>
            <Pressable
              onPress={() => navigation.navigate('Inscription')}
              accessibilityRole="link"
              className="min-h-[44px] justify-center"
            >
              <Text className="font-extrabold text-[15px] text-primary">
                Créer mon compte
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

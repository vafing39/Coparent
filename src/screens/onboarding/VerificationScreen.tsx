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
import { Trans, useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { OnboardingHeader } from '../../components/OnboardingHeader';
import { TextField } from '../../components/TextField';
import { CheckIcon, MailIcon } from '../../components/icons';
import { EMAIL_CODE_LENGTH, verificationErrorMessage } from '../../api/auth';
import { useResetOnUnmount } from '../../hooks/useResetOnUnmount';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../theme/ThemeProvider';

/**
 * Étape 1 de la première connexion. Le compte existe et la session est ouverte ;
 * l'utilisateur saisit le code à 8 chiffres reçu par email.
 */
export function VerificationScreen() {
  const { color } = useTheme();
  const { t } = useTranslation();
  const {
    user,
    signOut,
    verifyEmail,
    isVerifyingEmail,
    verifyEmailError,
    resetVerifyEmail,
    resendEmailVerification,
    isResendingEmailVerification,
    isEmailVerificationResent,
    resendEmailVerificationError,
    resetResendEmailVerification,
  } = useAuth();
  const email = user?.email;
  useResetOnUnmount(resetVerifyEmail, resetResendEmailVerification);
  const [code, setCode] = useState('');
  const [codeTooShort, setCodeTooShort] = useState(false);
  /** Dernière action, pour n'afficher que le message qui la concerne. */
  const [lastAction, setLastAction] = useState<'verify' | 'resend' | null>(
    null,
  );

  // En cas de succès, la session est mise à jour et la navigation passe à la suite.
  const submit = (value: string) => {
    if (value.length !== EMAIL_CODE_LENGTH) {
      setCodeTooShort(true);
      return;
    }
    setLastAction('verify');
    verifyEmail(value);
  };

  // Accepte un code collé avec un espace (« 4829 1375 ») : on ne garde que les chiffres.
  const onChangeCode = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, EMAIL_CODE_LENGTH);
    setCode(digits);
    setCodeTooShort(false);
    if (lastAction === 'verify') {
      setLastAction(null);
    }
    if (digits.length === EMAIL_CODE_LENGTH && !isVerifyingEmail) {
      submit(digits);
    }
  };

  const onResend = () => {
    setLastAction('resend');
    resendEmailVerification();
  };
  // L'adresse ne peut pas encore être modifiée côté serveur : on repart d'une inscription.
  const changeAddress = () => signOut({ then: 'Inscription' });

  let codeError: string | undefined;
  if (codeTooShort) {
    codeError = t('onboarding.verification.codeTooShort', {
      length: EMAIL_CODE_LENGTH,
    });
  } else if (lastAction === 'verify' && verifyEmailError) {
    codeError = verificationErrorMessage(verifyEmailError);
  }

  let resendFeedback: { kind: 'status' | 'error'; text: string } | null = null;
  if (lastAction === 'resend' && isEmailVerificationResent) {
    resendFeedback = {
      kind: 'status',
      text: t('onboarding.verification.resent'),
    };
  } else if (lastAction === 'resend' && resendEmailVerificationError) {
    resendFeedback = {
      kind: 'error',
      text: verificationErrorMessage(resendEmailVerificationError),
    };
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <OnboardingHeader
        step={1}
        onBack={changeAddress}
        backHint={t('onboarding.verification.backHint')}
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerClassName="grow px-6 pt-12 pb-8 gap-5"
          keyboardShouldPersistTaps="handled"
        >
          <View
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
            className="h-[88px] w-[88px] items-center justify-center rounded-full bg-primary-soft"
          >
            <MailIcon color={color('primary')} />
          </View>

          <View className="gap-2">
            <Text
              accessibilityRole="header"
              className="font-extrabold text-[28px] leading-[34px] text-text"
            >
              {t('onboarding.verification.title')}
            </Text>
            <Text className="font-regular text-[15px] leading-[22px] text-text">
              <Trans
                i18nKey="onboarding.verification.body"
                values={{ length: EMAIL_CODE_LENGTH, email }}
                components={{ bold: <Text className="font-extrabold" /> }}
              />
            </Text>
          </View>

          <TextField
            label={t('onboarding.verification.codeLabel')}
            hint={t('onboarding.verification.codeHint')}
            value={code}
            onChangeText={onChangeCode}
            error={codeError}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={() => submit(code)}
          />

          {resendFeedback ? (
            <View
              accessibilityRole={
                resendFeedback.kind === 'status' ? 'text' : 'alert'
              }
              accessibilityLiveRegion="polite"
              className="flex-row items-center gap-1.5 rounded-md bg-surface px-3.5 py-2.5"
            >
              {resendFeedback.kind === 'status' ? (
                <CheckIcon color={color('validated')} />
              ) : null}
              <Text
                className={`flex-1 font-bold text-[13px] leading-[18px] ${
                  resendFeedback.kind === 'status'
                    ? 'text-validated'
                    : 'text-error'
                }`}
              >
                {resendFeedback.text}
              </Text>
            </View>
          ) : null}

          <View className="mt-auto gap-2.5">
            <Button
              label={t('onboarding.verification.submit')}
              onPress={() => submit(code)}
              loading={isVerifyingEmail}
            />
            <Button
              label={t('onboarding.verification.resend')}
              variant="neutral"
              onPress={onResend}
              loading={isResendingEmailVerification}
            />
            <Pressable
              onPress={changeAddress}
              accessibilityRole="button"
              className="min-h-[44px] items-center justify-center"
            >
              <Text className="font-bold text-[15px] text-primary">
                {t('onboarding.verification.changeAddress')}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

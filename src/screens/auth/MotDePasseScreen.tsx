import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { CodeStep } from '../../features/forgotPassword/CodeStep';
import { DoneStep } from '../../features/forgotPassword/DoneStep';
import { EmailStep } from '../../features/forgotPassword/EmailStep';
import { useAuth } from '../../hooks/useAuth';
import { useResetOnUnmount } from '../../hooks/useResetOnUnmount';
import type { AuthScreenProps } from '../../navigation/types';

/**
 * Mot de passe oublié, en un seul écran : l'adresse, puis le code reçu par email avec le
 * nouveau mot de passe, puis la confirmation. Les réponses ne disent jamais si le compte existe.
 */
export function MotDePasseScreen({
  navigation,
  route,
}: AuthScreenProps<'MotDePasse'>) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'email' | 'code' | 'done'>('email');
  const [email, setEmail] = useState(route.params?.email ?? '');
  const { resetForgotPassword, resetResetPassword } = useAuth();
  useResetOnUnmount(resetForgotPassword, resetResetPassword);

  const onCodeSent = (sentTo: string) => {
    setEmail(sentTo);
    setStep('code');
  };

  const changeAddress = () => {
    resetForgotPassword();
    resetResetPassword();
    setStep('email');
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
            {t('forgotPassword.title')}
          </Text>

          {step === 'email' ? (
            <EmailStep defaultEmail={email} onSent={onCodeSent} />
          ) : null}
          {step === 'code' ? (
            <CodeStep
              email={email}
              onChangeAddress={changeAddress}
              onDone={() => setStep('done')}
            />
          ) : null}
          {step === 'done' ? (
            <DoneStep
              onSignIn={() => navigation.popTo('ConnexionEmail', { email })}
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

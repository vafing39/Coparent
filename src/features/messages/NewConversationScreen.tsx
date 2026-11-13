import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { messageErrorMessage } from '../../api/messages';
import { ErrorText } from '../../components/ErrorText';
import { TextField } from '../../components/TextField';
import { useMessages } from '../../hooks/useMessages';
import { useResetOnUnmount } from '../../hooks/useResetOnUnmount';
import type { AppScreenProps } from '../../navigation/types';
import {
  conversationSchema,
  ConversationValues,
} from '../../schemas/conversation';

/** Nouvelle discussion : un sujet et le premier message, puis la discussion s'ouvre. */
export function NewConversationScreen({
  navigation,
}: AppScreenProps<'NewConversation'>) {
  const { t } = useTranslation();
  const {
    createConversation,
    isCreatingConversation,
    createConversationError,
    resetCreateConversation,
  } = useMessages();
  useResetOnUnmount(resetCreateConversation);

  const { control, handleSubmit } = useForm<ConversationValues>({
    resolver: zodResolver(conversationSchema),
    defaultValues: { subject: '', body: '' },
  });

  const onSubmit = handleSubmit(values =>
    createConversation(values, {
      onSuccess: conversation =>
        navigation.replace('Conversation', {
          conversationId: conversation.id,
          subject: conversation.subject,
        }),
    }),
  );
  const send = () => {
    if (!isCreatingConversation) {
      onSubmit();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between px-3 pb-1.5 pt-4">
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          className="min-h-[48px] justify-center px-2"
        >
          <Text className="font-bold text-[15px] text-text">
            {t('common.cancel')}
          </Text>
        </Pressable>
        <Text
          accessibilityRole="header"
          className="font-extrabold text-[17px] text-text"
        >
          {t('messages.new.title')}
        </Text>
        <Pressable
          onPress={send}
          disabled={isCreatingConversation}
          accessibilityRole="button"
          accessibilityState={{
            disabled: isCreatingConversation,
            busy: isCreatingConversation,
          }}
          className={`min-h-[44px] justify-center rounded-full bg-primary px-4 ${
            isCreatingConversation ? 'opacity-60' : ''
          }`}
        >
          <Text className="font-extrabold text-[15px] text-on-primary">
            {t('messages.new.send')}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-4 px-4 pt-1.5 pb-8"
      >
        {createConversationError ? (
          <ErrorText text={messageErrorMessage(createConversationError)} />
        ) : null}
        <Controller
          control={control}
          name="subject"
          render={({ field, fieldState }) => (
            <TextField
              ref={field.ref}
              label={t('messages.new.subject')}
              placeholder={t('messages.new.subjectPlaceholder')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              maxLength={80}
              returnKeyType="next"
            />
          )}
        />
        <Controller
          control={control}
          name="body"
          render={({ field, fieldState }) => (
            <TextField
              ref={field.ref}
              label={t('messages.new.body')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              maxLength={2000}
              multiline
            />
          )}
        />
        <Text className="font-regular text-[13px] leading-[18px] text-text-secondary">
          {t('messages.new.hint')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

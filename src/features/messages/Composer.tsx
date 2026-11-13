import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { messageErrorMessage } from '../../api/messages';
import { ErrorText } from '../../components/ErrorText';
import { SendIcon } from '../../components/icons';
import { useMessages } from '../../hooks/useMessages';
import { useResetOnUnmount } from '../../hooks/useResetOnUnmount';
import { useTheme } from '../../theme/ThemeProvider';

const MAX_LENGTH = 2000;

/** Zone de saisie : le brouillon reste en place si l'envoi échoue. */
export function Composer({ recipient }: { recipient: string }) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const { sendMessage, isSendingMessage, sendMessageError, resetSendMessage } =
    useMessages();
  useResetOnUnmount(resetSendMessage);
  const [draft, setDraft] = useState('');
  const text = draft.trim();
  const disabled = text === '' || isSendingMessage;

  const send = () => {
    if (!disabled) {
      sendMessage(text, { onSuccess: () => setDraft('') });
    }
  };

  return (
    <View className="gap-2 border-t border-border bg-background px-4 pb-3 pt-2.5">
      {sendMessageError ? (
        <ErrorText text={messageErrorMessage(sendMessageError)} />
      ) : null}
      <View className="flex-row items-end gap-2">
        <TextInput
          value={draft}
          onChangeText={value => {
            setDraft(value);
            if (sendMessageError) {
              resetSendMessage();
            }
          }}
          multiline
          maxLength={MAX_LENGTH}
          accessibilityLabel={t('messages.inputLabel', { name: recipient })}
          placeholder={t('messages.placeholderTo', { name: recipient })}
          placeholderTextColor={color('text-secondary')}
          className="max-h-[120px] min-h-[48px] flex-1 rounded-[20px] border-[1.5px] border-text-secondary bg-card px-3.5 py-3 font-regular text-[15px] leading-[21px] text-text"
        />
        <Pressable
          onPress={send}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={t('messages.send')}
          accessibilityState={{ disabled, busy: isSendingMessage }}
          className={`h-12 w-12 items-center justify-center rounded-full bg-primary ${
            disabled ? 'opacity-50' : ''
          }`}
        >
          <SendIcon color={color('on-primary')} />
        </Pressable>
      </View>
    </View>
  );
}

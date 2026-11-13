import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { exchangeErrorMessage } from '../../api/exchanges';
import type { ExchangeBody, FamilyRole } from '../../api/types';
import { ErrorText } from '../../components/ErrorText';
import { SwitchRow } from '../../components/SwitchRow';
import { TextField } from '../../components/TextField';
import { useExchanges } from '../../hooks/useExchanges';
import { useFamily } from '../../hooks/useFamily';
import { useResetOnUnmount } from '../../hooks/useResetOnUnmount';
import { todayInParis } from '../../lib/dates';
import type { AppScreenProps } from '../../navigation/types';
import {
  EXCHANGE_MESSAGE_MAX_LENGTH,
  exchangeSchema,
  ExchangeValues,
} from '../../schemas/exchange';
import { addDays } from '../calendar/calendarDays';
import { parentOf } from '../custody/parents';
import { DateField } from '../events/DateField';

/**
 * Demande d'échange de garde (cahier des charges, 6) : je prends des nuits de l'autre parent et,
 * en option, je lui en laisse en retour, avec un message. Envoyée, la demande s'ouvre.
 */
export function ExchangeFormScreen({
  navigation,
}: AppScreenProps<'ExchangeForm'>) {
  const { t } = useTranslation();
  const { family } = useFamily();
  const {
    createExchange,
    isCreatingExchange,
    createExchangeError,
    resetCreateExchange,
  } = useExchanges();
  useResetOnUnmount(resetCreateExchange);

  const tomorrow = addDays(todayInParis(), 1);
  const { control, handleSubmit, watch } = useForm<ExchangeValues>({
    resolver: zodResolver(exchangeSchema),
    defaultValues: {
      takeFrom: tomorrow,
      takeTo: tomorrow,
      give: false,
      giveFrom: addDays(tomorrow, 7),
      giveTo: addDays(tomorrow, 7),
      message: '',
    },
  });
  const give = watch('give');

  if (!family) {
    return null;
  }
  const otherRole: FamilyRole =
    family.myRole === 'PARENT_A' ? 'PARENT_B' : 'PARENT_A';
  const other = parentOf(family, otherRole).name;

  const onSubmit = handleSubmit(values => {
    const body: ExchangeBody = {
      takeFrom: values.takeFrom,
      takeTo: values.takeTo,
    };
    if (values.give) {
      body.giveFrom = values.giveFrom;
      body.giveTo = values.giveTo;
    }
    if (values.message) {
      body.message = values.message;
    }
    createExchange(body, {
      onSuccess: exchange =>
        navigation.replace('ExchangeDetail', { exchangeId: exchange.id }),
    });
  });
  const send = () => {
    if (!isCreatingExchange) {
      onSubmit();
    }
  };

  const period = (from: 'takeFrom' | 'giveFrom', to: 'takeTo' | 'giveTo') => (
    <>
      <Controller
        control={control}
        name={from}
        render={({ field }) => (
          <DateField
            label={t('exchanges.form.firstNight')}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
      <Controller
        control={control}
        name={to}
        render={({ field, fieldState }) => (
          <>
            <DateField
              label={t('exchanges.form.lastNight')}
              value={field.value}
              onChange={field.onChange}
            />
            <ErrorText text={fieldState.error?.message} />
          </>
        )}
      />
    </>
  );

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
          {t('exchanges.form.title')}
        </Text>
        <Pressable
          onPress={send}
          disabled={isCreatingExchange}
          accessibilityRole="button"
          accessibilityState={{
            disabled: isCreatingExchange,
            busy: isCreatingExchange,
          }}
          className={`min-h-[44px] justify-center rounded-full bg-primary px-4 ${
            isCreatingExchange ? 'opacity-60' : ''
          }`}
        >
          <Text className="font-extrabold text-[15px] text-on-primary">
            {t('exchanges.form.send')}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-4 px-4 pt-1.5 pb-8"
      >
        {createExchangeError ? (
          <ErrorText text={exchangeErrorMessage(createExchangeError)} />
        ) : null}

        <View className="gap-3">
          <Text
            accessibilityRole="header"
            className="font-extrabold text-[15px] text-text"
          >
            {t('exchanges.form.take', { name: other })}
          </Text>
          {period('takeFrom', 'takeTo')}
        </View>

        <Controller
          control={control}
          name="give"
          render={({ field }) => (
            <SwitchRow
              label={t('exchanges.form.give')}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        {give ? (
          <View className="gap-3">
            <Text className="font-regular text-[13px] leading-[18px] text-text-secondary">
              {t('exchanges.form.giveHint', { name: other })}
            </Text>
            {period('giveFrom', 'giveTo')}
            <Controller
              control={control}
              name="giveFrom"
              render={({ fieldState }) => (
                <ErrorText text={fieldState.error?.message} />
              )}
            />
          </View>
        ) : null}

        <Controller
          control={control}
          name="message"
          render={({ field, fieldState }) => (
            <TextField
              ref={field.ref}
              label={t('exchanges.form.message')}
              placeholder={t('exchanges.form.messagePlaceholder')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              maxLength={EXCHANGE_MESSAGE_MAX_LENGTH}
              multiline
            />
          )}
        />
        <Text className="font-regular text-[13px] leading-[18px] text-text-secondary">
          {t('exchanges.form.hint', { name: other })}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

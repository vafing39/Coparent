import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { expenseErrorMessage, formatEuros, nameOf } from '../../api/expenses';
import type { ContestReason } from '../../api/types';
import { BackHeader } from '../../components/BackHeader';
import { Button } from '../../components/Button';
import { ErrorText } from '../../components/ErrorText';
import { RadioCard } from '../../components/RadioCard';
import { TextField } from '../../components/TextField';
import { useExpenses } from '../../hooks/useExpenses';
import { useFamily } from '../../hooks/useFamily';
import { useResetOnUnmount } from '../../hooks/useResetOnUnmount';
import type { AppScreenProps } from '../../navigation/types';
import {
  CONTEST_NOTE_MAX_LENGTH,
  contestSchema,
  ContestValues,
} from '../../schemas/expense';
import { childrenText, expenseSplit } from './expenseText';

const REASONS: ContestReason[] = ['AMOUNT', 'RECEIPT', 'NOT_AGREED', 'OTHER'];

/**
 * Contester une dépense en attente : un motif et une précision pour l'auteur. Elle reste hors du
 * solde jusqu'à ce que l'auteur la corrige ou la retire. Envoyée, l'écran se ferme.
 */
export function ContestExpenseScreen({
  navigation,
  route,
}: AppScreenProps<'ContestExpense'>) {
  const { t } = useTranslation();
  const { family } = useFamily();
  const {
    expenses,
    answerExpense,
    isAnsweringExpense,
    answerExpenseError,
    resetAnswerExpense,
  } = useExpenses();
  useResetOnUnmount(resetAnswerExpense);
  const { control, handleSubmit } = useForm<ContestValues>({
    resolver: zodResolver(contestSchema),
    defaultValues: { reason: 'AMOUNT', note: '' },
  });

  const expense = expenses?.find(e => e.id === route.params.expenseId);
  if (!family || !expense) {
    return null;
  }
  const author = nameOf(family, expense.authorRole);

  const onSubmit = handleSubmit(values =>
    answerExpense(
      {
        id: expense.id,
        action: 'contest',
        reason: values.reason,
        note: values.note || undefined,
      },
      { onSuccess: () => navigation.goBack() },
    ),
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <BackHeader
        title={t('expenses.contest.title')}
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="flex-grow gap-3.5 px-4 pt-1 pb-6"
      >
        <View
          accessible
          className="flex-row items-center gap-3 rounded-[20px] bg-card px-4 py-3.5"
        >
          <View className="flex-1">
            <Text className="font-bold text-[15px] text-text">
              {expense.label}
            </Text>
            <Text className="font-regular text-[13px] text-text-secondary">
              {t('expenses.contest.addedBy', {
                name: author,
                children: childrenText(expense),
                split: expenseSplit(family, expense),
              })}
            </Text>
          </View>
          <Text className="font-extrabold text-[15px] text-text">
            {formatEuros(expense.amountCents)}
          </Text>
        </View>

        <Controller
          control={control}
          name="reason"
          render={({ field }) => (
            <View className="gap-1.5">
              <Text className="font-bold text-[13px] text-text">
                {t('expenses.contest.reason')}
              </Text>
              <View
                accessibilityRole="radiogroup"
                accessibilityLabel={t('expenses.contest.reason')}
                className="gap-1.5"
              >
                {REASONS.map(reason => (
                  <RadioCard
                    key={reason}
                    label={t(`expenses.contest.reasons.${reason}`)}
                    checked={field.value === reason}
                    onPress={() => field.onChange(reason)}
                  />
                ))}
              </View>
            </View>
          )}
        />
        <Controller
          control={control}
          name="note"
          render={({ field, fieldState }) => (
            <TextField
              ref={field.ref}
              label={t('expenses.contest.note', { name: author })}
              placeholder={t('expenses.contest.notePlaceholder')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              maxLength={CONTEST_NOTE_MAX_LENGTH}
              multiline
            />
          )}
        />
        <Text className="mx-1 font-regular text-[13px] leading-[18px] text-text-secondary">
          {t('expenses.contest.hint', { name: author })}
        </Text>
        {answerExpenseError ? (
          <ErrorText text={expenseErrorMessage(answerExpenseError)} />
        ) : null}
        <View className="mt-auto">
          <Button
            label={t('expenses.contest.send')}
            onPress={onSubmit}
            loading={isAnsweringExpense}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

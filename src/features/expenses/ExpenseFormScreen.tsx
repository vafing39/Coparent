import React, { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  amountInput,
  expenseErrorMessage,
  nameOf,
  otherRole,
  parseAmount,
  ReceiptPhoto,
  ReceiptUploadError,
} from '../../api/expenses';
import type { Expense, Family } from '../../api/types';
import { ErrorText } from '../../components/ErrorText';
import { ModalHeader } from '../../components/ModalHeader';
import { ScreenSkeleton } from '../../components/ScreenSkeleton';
import { useExpenses } from '../../hooks/useExpenses';
import { useFamily } from '../../hooks/useFamily';
import { useResetOnUnmount } from '../../hooks/useResetOnUnmount';
import { todayInParis } from '../../lib/dates';
import type { AppScreenProps } from '../../navigation/types';
import { expenseSchema, ExpenseValues } from '../../schemas/expense';
import { ExpenseFields } from './ExpenseFields';
import { ReceiptField } from './ReceiptField';
import { SplitSheet } from './SplitSheet';
import { useReceiptSource } from './useReceiptSource';

/**
 * Nouvelle dépense, ou correction par son auteur (elle repasse en attente), avec son justificatif
 * photo facultatif. Enregistrée, l'écran se ferme.
 */
export function ExpenseFormScreen({
  navigation,
  route,
}: AppScreenProps<'ExpenseForm'>) {
  const { family } = useFamily();
  const { expenses } = useExpenses();
  const expenseId = route.params?.expenseId;
  const editing = expenseId
    ? expenses?.find(expense => expense.id === expenseId)
    : undefined;

  if (!family) {
    return null;
  }
  // Correction : le formulaire attend la dépense pour en reprendre les valeurs.
  if (expenseId && !editing) {
    return <ScreenSkeleton />;
  }
  return (
    <ExpenseForm
      family={family}
      editing={editing}
      onDone={() => navigation.goBack()}
    />
  );
}

function ExpenseForm({
  family,
  editing,
  onDone,
}: {
  family: Family;
  editing: Expense | undefined;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const { saveExpense, isSavingExpense, saveExpenseError, resetSaveExpense } =
    useExpenses();
  useResetOnUnmount(resetSaveExpense);
  const [splitOpen, setSplitOpen] = useState(false);
  // Photo choisie (envoyée après la dépense), 'remove' pour retirer le justificatif, ou inchangé.
  const [receipt, setReceipt] = useState<ReceiptPhoto | 'remove'>();
  // Une nouvelle dépense enregistrée sans son justificatif : réessayer la corrige, sans doublon.
  const [savedId, setSavedId] = useState(editing?.id);
  const savedReceipt = useReceiptSource(editing);
  const preview =
    receipt === 'remove' ? null : receipt ? { uri: receipt.uri } : savedReceipt;

  const today = todayInParis();
  const { control, handleSubmit, watch, setValue } = useForm<ExpenseValues>({
    resolver: zodResolver(expenseSchema(today)),
    defaultValues: editing
      ? {
          label: editing.label,
          amount: amountInput(editing.amountCents),
          category: editing.category,
          childIds: editing.children.map(child => child.id),
          payerRole: editing.payerRole,
          paidOn: editing.paidOn,
          payerSharePercent: editing.payerSharePercent,
        }
      : {
          label: '',
          amount: '',
          category: 'HEALTH',
          childIds: family.children.map(child => child.id),
          payerRole: family.myRole,
          paidOn: today,
          payerSharePercent: 50,
        },
  });

  const other = nameOf(family, otherRole(family.myRole));
  const payerRole = watch('payerRole');

  const onSubmit = handleSubmit(values => {
    saveExpense(
      {
        id: savedId,
        receipt,
        body: {
          label: values.label,
          amountCents: parseAmount(values.amount) ?? 0,
          category: values.category,
          childIds: values.childIds,
          payerRole: values.payerRole,
          paidOn: values.paidOn,
          payerSharePercent: values.payerSharePercent,
        },
      },
      {
        onSuccess: onDone,
        onError: error => {
          if (error instanceof ReceiptUploadError) {
            setSavedId(error.expense.id);
          }
        },
      },
    );
  });
  const send = () => {
    if (!isSavingExpense) {
      onSubmit();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <ModalHeader
        title={
          editing ? t('expenses.form.editTitle') : t('expenses.form.newTitle')
        }
        onCancel={onDone}
        actionLabel={editing ? t('expenses.form.save') : t('expenses.form.add')}
        onAction={send}
        busy={isSavingExpense}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-4 px-4 pt-1.5 pb-8"
      >
        {saveExpenseError ? (
          <ErrorText text={expenseErrorMessage(saveExpenseError)} />
        ) : null}
        <ReceiptField
          preview={preview}
          onPick={setReceipt}
          onRemove={() =>
            setReceipt(editing?.receiptUpdatedAt ? 'remove' : undefined)
          }
        />
        <ExpenseFields
          control={control}
          family={family}
          onOpenSplit={() => setSplitOpen(true)}
        />
        <Text className="mx-1 font-regular text-[13px] leading-[18px] text-text-secondary">
          {family.solo
            ? t('expenses.form.soloHint', { name: other })
            : t('expenses.form.hint', { name: other })}
        </Text>
      </ScrollView>
      <SplitSheet
        visible={splitOpen}
        value={watch('payerSharePercent')}
        payerName={nameOf(family, payerRole)}
        otherName={nameOf(family, otherRole(payerRole))}
        onPick={share => {
          setValue('payerSharePercent', share);
          setSplitOpen(false);
        }}
        onClose={() => setSplitOpen(false)}
      />
    </SafeAreaView>
  );
}

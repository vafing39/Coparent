import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Control, Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  formatEuros,
  nameOf,
  otherRole,
  owedCents,
  parseAmount,
  splitLabel,
} from '../../api/expenses';
import type { ExpenseCategory, Family, FamilyRole } from '../../api/types';
import { ErrorText } from '../../components/ErrorText';
import { TextField } from '../../components/TextField';
import { EXPENSE_LABEL_MAX_LENGTH, ExpenseValues } from '../../schemas/expense';
import { DateField } from '../events/DateField';
import { Chip } from './Chip';

const CATEGORIES: ExpenseCategory[] = [
  'HEALTH',
  'SCHOOL',
  'CANTEEN',
  'ACTIVITIES',
  'CLOTHING',
  'OTHER',
];
const ROLES: FamilyRole[] = ['PARENT_A', 'PARENT_B'];

type Props = {
  control: Control<ExpenseValues>;
  family: Family;
  /** Ouvre la feuille de choix de la répartition. */
  onOpenSplit: () => void;
};

/**
 * Champs d'une dépense : libellé, montant, catégorie, enfants, payeur, date, répartition, puis la
 * part de l'autre parent (indicative : le serveur la calcule).
 */
export function ExpenseFields({ control, family, onOpenSplit }: Props) {
  const { t } = useTranslation();
  const [payerRole, payerShare, amount] = useWatch({
    control,
    name: ['payerRole', 'payerSharePercent', 'amount'],
  });
  const amountCents = parseAmount(amount);
  const payerName = nameOf(family, payerRole);
  const nonPayerName = nameOf(family, otherRole(payerRole));
  const split = splitLabel(payerShare, payerName, nonPayerName);

  return (
    <>
      <Controller
        control={control}
        name="label"
        render={({ field, fieldState }) => (
          <TextField
            ref={field.ref}
            label={t('expenses.form.label')}
            placeholder={t('expenses.form.labelPlaceholder')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            maxLength={EXPENSE_LABEL_MAX_LENGTH}
          />
        )}
      />
      <Controller
        control={control}
        name="amount"
        render={({ field, fieldState }) => (
          <TextField
            ref={field.ref}
            label={t('expenses.form.amount')}
            placeholder={t('expenses.form.amountPlaceholder')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            keyboardType="decimal-pad"
          />
        )}
      />

      <Controller
        control={control}
        name="category"
        render={({ field }) => (
          <View className="gap-1.5">
            <Text className="font-bold text-[13px] text-text">
              {t('expenses.form.category')}
            </Text>
            <View
              accessibilityRole="radiogroup"
              accessibilityLabel={t('expenses.form.category')}
              className="flex-row flex-wrap gap-1.5"
            >
              {CATEGORIES.map(category => (
                <Chip
                  key={category}
                  role="radio"
                  label={t(`expenses.categories.${category}`)}
                  selected={field.value === category}
                  onPress={() => field.onChange(category)}
                />
              ))}
            </View>
          </View>
        )}
      />

      {family.children.length > 0 ? (
        <Controller
          control={control}
          name="childIds"
          render={({ field, fieldState }) => (
            <View className="gap-1.5">
              <Text className="font-bold text-[13px] text-text">
                {t('expenses.form.children')}
              </Text>
              <View className="flex-row flex-wrap gap-1.5">
                {family.children.map(child => {
                  const selected = field.value.includes(child.id);
                  return (
                    <Chip
                      key={child.id}
                      role="checkbox"
                      label={child.firstName}
                      selected={selected}
                      onPress={() =>
                        field.onChange(
                          selected
                            ? field.value.filter(id => id !== child.id)
                            : [...field.value, child.id],
                        )
                      }
                    />
                  );
                })}
              </View>
              <ErrorText text={fieldState.error?.message} />
            </View>
          )}
        />
      ) : null}

      <Controller
        control={control}
        name="payerRole"
        render={({ field }) => (
          <View className="gap-1.5">
            <Text className="font-bold text-[13px] text-text">
              {t('expenses.form.payer')}
            </Text>
            <View
              accessibilityRole="radiogroup"
              accessibilityLabel={t('expenses.form.payer')}
              className="flex-row gap-1.5"
            >
              {ROLES.map(role => (
                <Chip
                  key={role}
                  role="radio"
                  label={nameOf(family, role)}
                  selected={field.value === role}
                  onPress={() => field.onChange(role)}
                />
              ))}
            </View>
          </View>
        )}
      />
      <Controller
        control={control}
        name="paidOn"
        render={({ field, fieldState }) => (
          <View className="gap-1">
            <DateField
              label={t('expenses.form.paidOn')}
              value={field.value}
              onChange={field.onChange}
            />
            <ErrorText text={fieldState.error?.message} />
          </View>
        )}
      />

      <View className="rounded-[18px] bg-card px-3.5 py-1">
        <Pressable
          onPress={onOpenSplit}
          accessibilityRole="button"
          accessibilityLabel={`${t('expenses.form.split')} : ${split}`}
          className="min-h-[52px] flex-row items-center gap-3 active:opacity-70"
        >
          <Text className="flex-1 font-bold text-[15px] text-text">
            {t('expenses.form.split')}
          </Text>
          <Text className="font-regular text-[15px] text-text">{split}</Text>
        </Pressable>
        <View className="h-px bg-border" />
        <View
          accessible
          className="min-h-[52px] flex-row items-center justify-between"
        >
          <Text className="font-regular text-[15px] text-text">
            {t('expenses.form.share', { name: nonPayerName })}
          </Text>
          <Text className="font-extrabold text-[15px] text-text">
            {amountCents
              ? formatEuros(owedCents(amountCents, payerShare))
              : '—'}
          </Text>
        </View>
      </View>
    </>
  );
}

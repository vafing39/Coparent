import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ExpenseStatus } from '../../api/types';

export type ExpenseFilter = 'ALL' | Exclude<ExpenseStatus, 'WITHDRAWN'>;
const FILTERS: ExpenseFilter[] = ['ALL', 'PENDING', 'CONTESTED', 'VALIDATED'];

/** Filtres de la liste : Toutes, En attente, Contestées, Validées. */
export function ExpenseFilters({
  value,
  onChange,
}: {
  value: ExpenseFilter;
  onChange: (filter: ExpenseFilter) => void;
}) {
  const { t } = useTranslation();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={t('expenses.filters.label')}
      contentContainerClassName="gap-2"
    >
      {FILTERS.map(option => {
        const selected = value === option;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            className={`min-h-[40px] justify-center rounded-full border px-3.5 ${
              selected ? 'border-primary bg-primary' : 'border-border bg-card'
            }`}
          >
            <Text
              className={`font-bold text-[13px] ${
                selected ? 'text-on-primary' : 'text-text'
              }`}
            >
              {t(`expenses.filters.${option}`)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

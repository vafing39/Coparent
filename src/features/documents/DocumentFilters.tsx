import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DOCUMENT_CATEGORIES } from '../../api/documents';
import type { DocumentCategory } from '../../api/types';

export type DocumentFilter = 'ALL' | DocumentCategory;
const FILTERS: DocumentFilter[] = ['ALL', ...DOCUMENT_CATEGORIES];

/** Filtres par catégorie : Tous, École, Assurance, Identité, Jugement, Autre. */
export function DocumentFilters({
  value,
  onChange,
}: {
  value: DocumentFilter;
  onChange: (filter: DocumentFilter) => void;
}) {
  const { t } = useTranslation();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={t('documents.filters.label')}
      className="my-2"
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
              {option === 'ALL'
                ? t('documents.filters.ALL')
                : t(`documents.categories.${option}`)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

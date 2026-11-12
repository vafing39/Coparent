import React from 'react';
import { useTranslation } from 'react-i18next';
import { TabPlaceholder } from '../../components/TabPlaceholder';

/** Onglet Dépenses : état vide (fonction de priorité 2). */
export function DepensesScreen() {
  const { t } = useTranslation();
  return (
    <TabPlaceholder title={t('tabs.depenses')} text={t('expenses.empty')} />
  );
}

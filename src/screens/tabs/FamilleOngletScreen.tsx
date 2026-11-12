import React from 'react';
import { useTranslation } from 'react-i18next';
import { TabPlaceholder } from '../../components/TabPlaceholder';

/** Onglet Famille : état vide (fonction de priorité 2). */
export function FamilleOngletScreen() {
  const { t } = useTranslation();
  return (
    <TabPlaceholder title={t('tabs.famille')} text={t('familyTab.empty')} />
  );
}

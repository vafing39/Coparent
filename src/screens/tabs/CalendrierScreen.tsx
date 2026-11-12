import React from 'react';
import { useTranslation } from 'react-i18next';
import { TabPlaceholder } from '../../components/TabPlaceholder';

/** Onglet Calendrier. PROVISOIRE : en attendant le calendrier de garde. */
export function CalendrierScreen() {
  const { t } = useTranslation();
  return (
    <TabPlaceholder
      title={t('tabs.calendrier')}
      text={t('calendar.placeholder')}
    />
  );
}

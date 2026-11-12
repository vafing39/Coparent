import React from 'react';
import { useTranslation } from 'react-i18next';
import { TabPlaceholder } from '../../components/TabPlaceholder';

/** Onglet Messages. PROVISOIRE : en attendant la messagerie. */
export function MessagesScreen() {
  const { t } = useTranslation();
  return (
    <TabPlaceholder
      title={t('tabs.messages')}
      text={t('messages.placeholder')}
    />
  );
}

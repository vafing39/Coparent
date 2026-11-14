import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckIcon } from '../../../components/icons';
import { useTheme } from '../../../theme/ThemeProvider';
import { StatusLine } from './StatusLine';

/** Solde à zéro, sans virement en cours. */
export function NothingToSettle() {
  const { t } = useTranslation();
  const { color } = useTheme();
  return (
    <StatusLine
      icon={<CheckIcon size={18} color={color('validated')} />}
      text={t('expenses.settle.nothing')}
    />
  );
}

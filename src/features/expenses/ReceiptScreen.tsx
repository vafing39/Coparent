import React, { useState } from 'react';
import { ActivityIndicator, Image, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackHeader } from '../../components/BackHeader';
import { LoadError } from '../../components/LoadError';
import { useExpenses } from '../../hooks/useExpenses';
import type { AppScreenProps } from '../../navigation/types';
import { useTheme } from '../../theme/ThemeProvider';
import { useReceiptSource } from './useReceiptSource';

/** Justificatif photo d'une dépense, en plein écran (les deux parents). */
export function ReceiptScreen({
  navigation,
  route,
}: AppScreenProps<'Receipt'>) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const { expenses, reloadExpenses } = useExpenses();
  const expense = expenses?.find(e => e.id === route.params.expenseId);
  const source = useReceiptSource(expense);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<'loading' | 'loaded' | 'failed'>(
    'loading',
  );

  // Recharger la liste rafraîchit aussi la session si le jeton a expiré (l'image le réutilise).
  const retry = () => {
    reloadExpenses();
    setState('loading');
    setAttempt(n => n + 1);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <BackHeader
        title={t('expenses.receipt.title')}
        onBack={() => navigation.goBack()}
      />
      {!source || state === 'failed' ? (
        <LoadError message={t('expenses.receipt.loadFailed')} onRetry={retry} />
      ) : (
        <View className="flex-1 px-4 pb-4">
          <Image
            key={attempt}
            source={source}
            accessibilityLabel={t('expenses.receipt.viewLabel', {
              label: expense?.label ?? '',
            })}
            resizeMode="contain"
            onLoad={() => setState('loaded')}
            onError={() => setState('failed')}
            className="flex-1"
          />
          {state === 'loading' ? (
            <View className="absolute inset-0 items-center justify-center">
              <ActivityIndicator color={color('primary')} />
            </View>
          ) : null}
        </View>
      )}
    </SafeAreaView>
  );
}

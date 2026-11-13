import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dataExportErrorMessage } from '../../api/account';
import { BackHeader } from '../../components/BackHeader';
import { Button } from '../../components/Button';
import { ErrorText } from '../../components/ErrorText';
import { CheckIcon } from '../../components/icons';
import { useAccount } from '../../hooks/useAccount';
import { useAuth } from '../../hooks/useAuth';
import { useResetOnUnmount } from '../../hooks/useResetOnUnmount';
import type { AppScreenProps } from '../../navigation/types';
import { useTheme } from '../../theme/ThemeProvider';

const ITEMS = ['account', 'family', 'events', 'messages', 'other'] as const;

/** « Télécharger mes données » (cahier des charges, 1) : un fichier envoyé par email à l'adresse du compte. */
export function DataExportScreen({ navigation }: AppScreenProps<'MesDonnees'>) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const { user } = useAuth();
  const {
    requestDataExport,
    isRequestingDataExport,
    isDataExportSent,
    dataExportError,
    resetDataExport,
  } = useAccount();
  useResetOnUnmount(resetDataExport);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <BackHeader
        title={t('account.data.title')}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerClassName="grow gap-4 px-4 pt-2 pb-8">
        <View className="gap-2 rounded-[20px] border border-border bg-card p-4">
          <Text className="font-bold text-[15px] leading-[21px] text-text">
            {t('account.data.intro')}
          </Text>
          {ITEMS.map(item => (
            <Text
              key={item}
              className="font-regular text-[15px] leading-[21px] text-text"
            >
              {`• ${t(`account.data.items.${item}`)}`}
            </Text>
          ))}
          <Text className="mt-1 font-regular text-[13px] text-text-secondary">
            {t('account.data.privacy')}
          </Text>
        </View>

        {isDataExportSent ? (
          <View
            accessibilityLiveRegion="polite"
            className="flex-row items-center gap-2 rounded-2xl bg-surface px-4 py-3.5"
          >
            <CheckIcon color={color('validated')} />
            <Text className="flex-1 font-regular text-[15px] leading-[21px] text-text">
              <Trans
                i18nKey="account.data.sent"
                values={{ email: user?.email ?? '' }}
                components={{ bold: <Text className="font-bold" /> }}
              />
            </Text>
          </View>
        ) : null}

        <View className="mt-auto gap-2.5">
          {dataExportError ? (
            <ErrorText text={dataExportErrorMessage(dataExportError)} />
          ) : null}
          {isDataExportSent ? null : (
            <Button
              label={t('account.data.submit')}
              onPress={() => requestDataExport()}
              loading={isRequestingDataExport}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

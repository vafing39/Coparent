import React, { useEffect } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { exchangeErrorMessage } from '../../api/exchanges';
import type { FamilyRole } from '../../api/types';
import { LoadError } from '../../components/LoadError';
import { ChevronLeftIcon } from '../../components/icons';
import { useExchanges } from '../../hooks/useExchanges';
import { useFamily } from '../../hooks/useFamily';
import { useResetOnUnmount } from '../../hooks/useResetOnUnmount';
import type { AppScreenProps } from '../../navigation/types';
import { useTheme } from '../../theme/ThemeProvider';
import { parentOf } from '../custody/parents';
import { ExchangeDetails } from './ExchangeDetails';

/**
 * Une demande d'échange de garde. L'autre parent l'accepte, la refuse ou propose une autre date
 * (une discussion s'ouvre, la demande reste en attente) ; le demandeur peut l'annuler tant
 * qu'elle attend. Après une réponse, l'écran se ferme.
 */
export function ExchangeDetailScreen({
  navigation,
  route,
}: AppScreenProps<'ExchangeDetail'>) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const { family } = useFamily();
  const { exchangeId } = route.params;
  const {
    openExchange,
    closeExchange,
    exchange,
    isLoadingExchange,
    exchangeError,
    reloadExchange,
    answerExchange,
    isAnsweringExchange,
    answerExchangeError,
    resetAnswerExchange,
  } = useExchanges();
  useResetOnUnmount(resetAnswerExchange);

  useEffect(() => {
    openExchange(exchangeId);
    return () => closeExchange();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ouvrir une fois par demande
  }, [exchangeId]);

  if (!family) {
    return null;
  }
  const otherRole: FamilyRole =
    family.myRole === 'PARENT_A' ? 'PARENT_B' : 'PARENT_A';
  const other = parentOf(family, otherRole).name;

  let body: React.ReactNode;
  if (exchangeError && !exchange) {
    body = (
      <LoadError
        message={exchangeErrorMessage(exchangeError)}
        onRetry={reloadExchange}
      />
    );
  } else if (isLoadingExchange || !exchange) {
    body = (
      <View
        accessible
        accessibilityLabel={t('common.loading')}
        className="h-[180px] rounded-[20px] bg-surface"
      />
    );
  } else {
    body = (
      <ExchangeDetails
        exchange={exchange}
        other={other}
        isAnswering={isAnsweringExchange}
        answerError={answerExchangeError}
        onAnswer={answer =>
          answerExchange(
            { id: exchangeId, answer },
            { onSuccess: () => navigation.goBack() },
          )
        }
        onOtherDate={period =>
          navigation.navigate('NewConversation', {
            subject: t('exchanges.detail.discussionSubject', { period }),
          })
        }
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-row items-center gap-1 border-b border-border pb-3 pl-2 pr-4 pt-6">
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          className="h-12 w-12 items-center justify-center rounded-full"
        >
          <ChevronLeftIcon color={color('text')} />
        </Pressable>
        <Text
          accessibilityRole="header"
          className="flex-1 font-extrabold text-[20px] leading-[26px] text-text"
        >
          {t('exchanges.detail.title')}
        </Text>
      </View>
      <ScrollView contentContainerClassName="gap-4 px-4 pt-4 pb-8">
        {body}
      </ScrollView>
    </SafeAreaView>
  );
}

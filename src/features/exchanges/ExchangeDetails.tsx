import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { exchangeErrorMessage, exchangePeriod } from '../../api/exchanges';
import type { Exchange } from '../../api/types';
import { Button } from '../../components/Button';
import { DetailRow } from '../../components/DetailRow';
import { ErrorText } from '../../components/ErrorText';
import type { ExchangeAnswer } from '../../context/ExchangesContext';
import { statusText } from './statusText';

type Props = {
  exchange: Exchange;
  /** Prénom de l'autre parent (celui qui ne lit pas). */
  other: string;
  isAnswering: boolean;
  answerError: Error | null;
  /** Accepter, refuser ou annuler (refuser et annuler sont confirmés avant). */
  onAnswer: (answer: ExchangeAnswer) => void;
  /** « Proposer une autre date » : ouvre une discussion sur cette période. */
  onOtherDate: (period: string) => void;
};

/**
 * Le contenu d'une demande d'échange chargée : où elle en est, les nuits prises et laissées, le
 * message, puis les actions de qui la lit (répondre, ou annuler sa propre demande).
 */
export function ExchangeDetails({
  exchange,
  other,
  isAnswering,
  answerError,
  onAnswer,
  onOtherDate,
}: Props) {
  const { t } = useTranslation();
  const requester = exchange.requestedByFirstName ?? t('home.otherParent');
  const pending = exchange.status === 'PENDING';

  const confirm = (title: string, action: string, answer: ExchangeAnswer) =>
    Alert.alert(title, undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: action, style: 'destructive', onPress: () => onAnswer(answer) },
    ]);

  return (
    <>
      <Text
        accessibilityRole="text"
        className="mx-1 font-semibold text-[15px] leading-[21px] text-text"
      >
        {statusText(exchange, requester, other)}
      </Text>
      <View className="rounded-[20px] border border-border bg-card px-4">
        <DetailRow
          label={
            exchange.mine
              ? t('exchanges.detail.youTake', { name: other })
              : t('exchanges.detail.theyTake', { name: requester })
          }
          value={exchangePeriod(exchange.takeFrom, exchange.takeTo)}
        />
        {exchange.giveFrom && exchange.giveTo ? (
          <DetailRow
            divider
            label={
              exchange.mine
                ? t('exchanges.detail.youGive', { name: other })
                : t('exchanges.detail.theyGive', { name: requester })
            }
            value={exchangePeriod(exchange.giveFrom, exchange.giveTo)}
          />
        ) : (
          <DetailRow
            divider
            label={t('exchanges.detail.inReturn')}
            value={t('exchanges.detail.nothingInReturn')}
          />
        )}
        {exchange.message ? (
          <DetailRow
            divider
            label={t('exchanges.detail.message', {
              name: exchange.mine ? t('messages.you') : requester,
            })}
            value={exchange.message}
          />
        ) : null}
      </View>

      {answerError ? (
        <ErrorText text={exchangeErrorMessage(answerError)} />
      ) : null}

      {pending && !exchange.mine ? (
        <View className="gap-3">
          <Button
            label={t('exchanges.detail.accept')}
            loading={isAnswering}
            onPress={() => onAnswer('accept')}
          />
          <Button
            label={t('exchanges.detail.otherDate')}
            variant="secondary"
            disabled={isAnswering}
            onPress={() =>
              onOtherDate(exchangePeriod(exchange.takeFrom, exchange.takeTo))
            }
          />
          <Text className="mx-1 font-regular text-[13px] leading-[18px] text-text-secondary">
            {t('exchanges.detail.otherDateHint')}
          </Text>
          <Pressable
            onPress={() =>
              confirm(
                t('exchanges.detail.declineConfirm'),
                t('exchanges.detail.decline'),
                'decline',
              )
            }
            disabled={isAnswering}
            accessibilityRole="button"
            className="min-h-[48px] items-center justify-center"
          >
            <Text className="font-bold text-[15px] text-error">
              {t('exchanges.detail.decline')}
            </Text>
          </Pressable>
        </View>
      ) : null}
      {pending && exchange.mine ? (
        <Pressable
          onPress={() =>
            confirm(
              t('exchanges.detail.cancelConfirm'),
              t('exchanges.detail.cancel'),
              'cancel',
            )
          }
          disabled={isAnswering}
          accessibilityRole="button"
          className="min-h-[48px] items-center justify-center"
        >
          <Text className="font-bold text-[15px] text-error">
            {t('exchanges.detail.cancel')}
          </Text>
        </Pressable>
      ) : null}
    </>
  );
}

import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { useBag } from '../../hooks/useBag';
import { useCustody } from '../../hooks/useCustody';
import { useFamily } from '../../hooks/useFamily';
import { NextHandoverCard } from './NextHandoverCard';
import { TonightCard } from './TonightCard';

/** « Ce soir » et « Prochain passage », avec leur chargement et leur erreur. */
export function CustodyCards({ onOpenBag }: { onOpenBag: () => void }) {
  const { t } = useTranslation();
  const { family } = useFamily();
  const { today, custody, custodyError, reloadCustody } = useCustody();
  const { bag } = useBag();

  if (custodyError) {
    return (
      <View className="gap-3 rounded-[20px] border border-border bg-card p-[18px]">
        <Text
          accessibilityRole="alert"
          className="font-regular text-[15px] leading-[22px] text-text"
        >
          {t('home.loadFailed')}
        </Text>
        <Button
          label={t('common.retry')}
          variant="secondary"
          onPress={reloadCustody}
        />
      </View>
    );
  }

  const tonight = custody?.nights.find(night => night.date === today);
  if (!family || !custody || !tonight) {
    return (
      <View
        accessible
        accessibilityLabel={t('common.loading')}
        className="gap-4"
      >
        <View className="h-[110px] rounded-[20px] bg-surface" />
        <View className="h-[110px] rounded-[20px] bg-surface" />
      </View>
    );
  }

  return (
    <>
      <TonightCard
        family={family}
        parent={tonight.parent}
        proposed={family.solo || custody.scheduleStatus !== 'ACTIVE'}
        nextHandover={custody.nextHandover}
      />
      {custody.nextHandover ? (
        <NextHandoverCard
          family={family}
          handover={custody.nextHandover}
          today={today}
          onOpenBag={onOpenBag}
          bagCount={
            bag && bag.total > 0
              ? { checked: bag.checkedCount, total: bag.total }
              : undefined
          }
        />
      ) : null}
    </>
  );
}

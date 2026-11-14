import React from 'react';
import { Modal, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PAYER_SHARES, splitLabel } from '../../api/expenses';
import { Button } from '../../components/Button';
import { RadioCard } from '../../components/RadioCard';

type Props = {
  visible: boolean;
  /** Part du payeur choisie. */
  value: number;
  payerName: string;
  otherName: string;
  onPick: (payerShare: number) => void;
  onClose: () => void;
};

/** Feuille de choix de la répartition : 50/50, 60/40, 70/30, 100 %, dans les deux sens. */
export function SplitSheet({
  visible,
  value,
  payerName,
  otherName,
  onPick,
  onClose,
}: Props) {
  const { t } = useTranslation();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-text/40">
        <View className="gap-3 rounded-t-3xl bg-card px-6 pb-10 pt-6">
          <Text
            accessibilityRole="header"
            className="font-extrabold text-[17px] text-text"
          >
            {t('expenses.form.splitTitle')}
          </Text>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel={t('expenses.form.split')}
            className="gap-2"
          >
            {PAYER_SHARES.map(share => (
              <RadioCard
                key={share}
                label={splitLabel(share, payerName, otherName)}
                checked={value === share}
                onPress={() => onPick(share)}
              />
            ))}
          </View>
          <Button
            label={t('common.cancel')}
            variant="neutral"
            onPress={onClose}
          />
        </View>
      </View>
    </Modal>
  );
}

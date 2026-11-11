import React from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { VACATION_ZONES } from '../../schemas/family';

type Props = {
  visible: boolean;
  onClose: () => void;
};

/** Feuille d'information : les académies de chaque zone de vacances scolaires. */
export function ZonesInfoSheet({ visible, onClose }: Props) {
  const { t } = useTranslation();
  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <ScrollView contentContainerClassName="grow px-6 pt-8 pb-8 gap-5">
          <View className="gap-1.5">
            <Text
              accessibilityRole="header"
              className="font-extrabold text-[24px] leading-[30px] text-text"
            >
              {t('onboarding.family.zone.info.title')}
            </Text>
            <Text className="font-regular text-[15px] leading-[21px] text-text-secondary">
              {t('onboarding.family.zone.info.intro')}
            </Text>
          </View>

          <View className="gap-2">
            {VACATION_ZONES.map(zone => (
              <View
                key={zone}
                accessible
                className="gap-1 rounded-2xl border-[1.5px] border-border bg-surface px-3.5 py-3"
              >
                <Text className="font-bold text-[15px] text-text">
                  {t(`onboarding.family.zone.options.${zone}.label`)}
                </Text>
                <Text className="font-regular text-[13px] leading-[19px] text-text-secondary">
                  {t(`onboarding.family.zone.info.academies.${zone}`)}
                </Text>
              </View>
            ))}
          </View>

          <Text className="font-regular text-[13px] text-text-secondary">
            {t('onboarding.family.zone.info.source')}
          </Text>

          <View className="mt-auto">
            <Button
              label={t('onboarding.family.zone.info.close')}
              onPress={onClose}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

import React, { useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { ClockIcon } from '../../components/icons';
import { formatTime } from '../../lib/dates';
import { useTheme } from '../../theme/ThemeProvider';

type Props = {
  label: string;
  /** « HH:mm » (heure de Paris : le sélecteur ne sert qu'à choisir heures et minutes). */
  value: string;
  onChange: (value: string) => void;
};

function toDate(time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(2000, 0, 1, hours, minutes);
}

function fromDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Champ d'heure : sélecteur natif (dialogue sur Android, roue dans une feuille sur iOS). */
export function TimeField({ label, value, onChange }: Props) {
  const { t } = useTranslation();
  const { color, scheme } = useTheme();
  const [iosOpen, setIosOpen] = useState(false);
  const [iosValue, setIosValue] = useState(value);

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: toDate(value),
        mode: 'time',
        is24Hour: true,
        onChange: (event, date) => {
          if (event.type === 'set' && date) {
            onChange(fromDate(date));
          }
        },
      });
      return;
    }
    setIosValue(value);
    setIosOpen(true);
  };

  const confirmIos = () => {
    onChange(iosValue);
    setIosOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={`${label} : ${formatTime(value)}`}
        accessibilityHint={t('onboarding.schedule.handoverTimeHint')}
        className="min-h-[52px] flex-row items-center gap-3 rounded-md border-[1.5px] border-text-secondary bg-surface px-4 active:opacity-70"
      >
        <View className="flex-1">
          <Text className="font-bold text-[11px] text-text-secondary">
            {label}
          </Text>
          <Text className="font-bold text-[15px] text-text">
            {formatTime(value)}
          </Text>
        </View>
        <ClockIcon color={color('text-secondary')} />
      </Pressable>

      {Platform.OS === 'ios' ? (
        <Modal
          visible={iosOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setIosOpen(false)}
        >
          <View className="flex-1 justify-end bg-text/40">
            <View className="gap-4 rounded-t-3xl bg-card px-6 pb-10 pt-6">
              <Text
                accessibilityRole="header"
                className="font-extrabold text-[17px] text-text"
              >
                {label}
              </Text>
              <DateTimePicker
                testID="time-picker"
                value={toDate(iosValue)}
                mode="time"
                display="spinner"
                locale="fr-FR"
                themeVariant={scheme}
                onChange={(_event, date) => {
                  if (date) {
                    setIosValue(fromDate(date));
                  }
                }}
              />
              <Button label={t('common.ok')} onPress={confirmIos} />
            </View>
          </View>
        </Modal>
      ) : null}
    </>
  );
}

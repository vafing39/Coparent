import React, { useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { CalendarIcon } from '../../components/icons';
import { calendarDay, ISO_DATE } from '../../lib/dates';
import dayjs from '../../lib/dayjs';
import { useTheme } from '../../theme/ThemeProvider';

type Props = {
  label: string;
  /** « AAAA-MM-JJ » (jour du calendrier, sans fuseau). */
  value: string;
  onChange: (value: string) => void;
};

/** « AAAA-MM-JJ » → Date pour le sélecteur natif (midi, heure du téléphone : jamais la veille). */
function toDate(isoDate: string): Date {
  return dayjs(`${isoDate}T12:00`).toDate();
}

/** Jour choisi dans le sélecteur → « AAAA-MM-JJ ». */
function fromDate(date: Date): string {
  return dayjs(date).format(ISO_DATE);
}

/** « jeu. 19 nov. 2026 ». */
function display(isoDate: string): string {
  return calendarDay(isoDate).format('ddd D MMM YYYY');
}

/**
 * Champ de date : sélecteur natif (dialogue sur Android, calendrier dans une feuille sur iOS).
 * Même présentation que TimeField.
 */
export function DateField({ label, value, onChange }: Props) {
  const { t } = useTranslation();
  const { color, scheme } = useTheme();
  const [iosOpen, setIosOpen] = useState(false);
  const [iosValue, setIosValue] = useState(value);

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: toDate(value),
        mode: 'date',
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
        accessibilityLabel={`${label} : ${display(value)}`}
        accessibilityHint={t('events.dateHint')}
        className="min-h-[52px] flex-row items-center gap-3 rounded-md border-[1.5px] border-text-secondary bg-surface px-4 active:opacity-70"
      >
        <View className="flex-1">
          <Text className="font-bold text-[11px] text-text-secondary">
            {label}
          </Text>
          <Text className="font-bold text-[15px] text-text">
            {display(value)}
          </Text>
        </View>
        <CalendarIcon color={color('text-secondary')} />
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
                testID="date-picker"
                value={toDate(iosValue)}
                mode="date"
                display="inline"
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

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CameraIcon, FileIcon } from '../../components/icons';
import { useTheme } from '../../theme/ThemeProvider';

/** « Photographier » et « Choisir un fichier », côte à côte ; le choix fait est mis en avant. */
export function FileSourceButtons({
  chosen,
  onPhoto,
  onFile,
}: {
  chosen: 'photo' | 'file' | null;
  onPhoto: () => void;
  onFile: () => void;
}) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const button = (
    source: 'photo' | 'file',
    label: string,
    icon: React.ReactNode,
    onPress: () => void,
  ) => {
    const selected = chosen === source;
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        className={`min-h-[96px] flex-1 items-center justify-center gap-2 rounded-[18px] ${
          selected
            ? 'border-2 border-primary bg-primary-soft'
            : 'border-[1.5px] border-border bg-card'
        }`}
      >
        {icon}
        <Text className="font-bold text-[15px] text-text">{label}</Text>
      </Pressable>
    );
  };
  return (
    <View className="flex-row gap-2">
      {button(
        'photo',
        t('documents.form.photo'),
        <CameraIcon size={26} color={color('primary')} />,
        onPhoto,
      )}
      {button(
        'file',
        t('documents.form.file'),
        <FileIcon size={26} color={color('primary')} />,
        onFile,
      )}
    </View>
  );
}

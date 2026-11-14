import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DocumentFile, formatFileSize } from '../../api/documents';

/** Le fichier choisi : son type (PDF ou photo), son nom et sa taille. */
export function PickedFileCard({ file }: { file: DocumentFile }) {
  const { t } = useTranslation();
  const pdf = file.type === 'application/pdf';
  return (
    <View
      accessible
      className="flex-row items-center gap-3 rounded-[16px] bg-card px-3.5 py-3"
    >
      <View className="h-10 w-10 items-center justify-center rounded-[12px] bg-background">
        <Text className="font-extrabold text-[11px] text-primary">
          {pdf ? 'PDF' : 'JPG'}
        </Text>
      </View>
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="font-bold text-[15px] text-text">
          {file.name}
        </Text>
        <Text className="font-regular text-[13px] text-text-secondary">
          {file.size !== null
            ? formatFileSize(file.size)
            : t('documents.form.photoName')}
        </Text>
      </View>
    </View>
  );
}

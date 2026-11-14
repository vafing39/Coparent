import React, { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_MAX_BYTES,
  DocumentFile,
  documentErrorMessage,
  titleFromFileName,
} from '../../api/documents';
import { nameOf, otherRole } from '../../api/expenses';
import { ErrorText } from '../../components/ErrorText';
import { ModalHeader } from '../../components/ModalHeader';
import { TextField } from '../../components/TextField';
import { useDocuments } from '../../hooks/useDocuments';
import { useFamily } from '../../hooks/useFamily';
import { useResetOnUnmount } from '../../hooks/useResetOnUnmount';
import {
  PickedDocument,
  pickDocumentFile,
  pickDocumentPhoto,
} from '../../lib/documentFile';
import type { AppScreenProps } from '../../navigation/types';
import {
  DOCUMENT_TITLE_MAX_LENGTH,
  documentSchema,
  DocumentValues,
} from '../../schemas/document';
import { Chip } from '../expenses/Chip';
import { FileSourceButtons } from './FileSourceButtons';
import { PickedFileCard } from './PickedFileCard';

/**
 * Nouveau document : une photo ou un fichier (PDF, image), son nom (repris du fichier),
 * sa catégorie et l'enfant concerné. Envoyé, l'écran se ferme.
 */
export function DocumentFormScreen({
  navigation,
}: AppScreenProps<'DocumentForm'>) {
  const { t } = useTranslation();
  const { family } = useFamily();
  const {
    uploadDocument,
    isUploadingDocument,
    uploadDocumentError,
    resetUploadDocument,
  } = useDocuments();
  useResetOnUnmount(resetUploadDocument);
  const [file, setFile] = useState<DocumentFile | null>(null);
  const [source, setSource] = useState<'photo' | 'file' | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const { control, handleSubmit, getValues, setValue } =
    useForm<DocumentValues>({
      resolver: zodResolver(documentSchema),
      defaultValues: { title: '', category: 'SCHOOL', childId: null },
    });

  if (!family) {
    return null;
  }
  const other = nameOf(family, otherRole(family.myRole));

  const applyPicked = (result: PickedDocument, from: 'photo' | 'file') => {
    if ('file' in result) {
      if (result.file.size !== null && result.file.size > DOCUMENT_MAX_BYTES) {
        setFileError(t('documents.form.tooLarge'));
        return;
      }
      setFile(result.file);
      setSource(from);
      setFileError(null);
      if (!getValues('title').trim()) {
        setValue(
          'title',
          from === 'file' ? titleFromFileName(result.file.name) : '',
        );
      }
    } else if ('error' in result) {
      Alert.alert(t(`documents.form.${result.error}`));
    }
  };
  const photo = () =>
    Alert.alert(t('documents.form.photoTitle'), undefined, [
      {
        text: t('documents.form.takePhoto'),
        onPress: async () =>
          applyPicked(await pickDocumentPhoto('camera'), 'photo'),
      },
      {
        text: t('documents.form.pickPhoto'),
        onPress: async () =>
          applyPicked(await pickDocumentPhoto('library'), 'photo'),
      },
      { text: t('documents.form.cancel'), style: 'cancel' },
    ]);
  const chooseFile = async () => applyPicked(await pickDocumentFile(), 'file');

  const onSubmit = handleSubmit(values => {
    if (!file) {
      setFileError(t('documents.form.fileRequired'));
      return;
    }
    uploadDocument(
      {
        file,
        title: values.title,
        category: values.category,
        childId: values.childId,
      },
      { onSuccess: () => navigation.goBack() },
    );
  });
  const send = () => {
    if (!isUploadingDocument) {
      onSubmit();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <ModalHeader
        title={t('documents.form.title')}
        onCancel={() => navigation.goBack()}
        actionLabel={t('documents.form.send')}
        onAction={send}
        busy={isUploadingDocument}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-3.5 px-4 pt-1.5 pb-8"
      >
        {uploadDocumentError ? (
          <ErrorText text={documentErrorMessage(uploadDocumentError)} />
        ) : null}
        <FileSourceButtons
          chosen={source}
          onPhoto={photo}
          onFile={chooseFile}
        />
        {file ? <PickedFileCard file={file} /> : null}
        {fileError ? <ErrorText text={fileError} /> : null}

        <Controller
          control={control}
          name="title"
          render={({ field, fieldState }) => (
            <TextField
              ref={field.ref}
              label={t('documents.form.name')}
              placeholder={t('documents.form.namePlaceholder')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              maxLength={DOCUMENT_TITLE_MAX_LENGTH}
            />
          )}
        />
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <View className="gap-1.5">
              <Text className="font-bold text-[13px] text-text">
                {t('documents.form.category')}
              </Text>
              <View
                accessibilityRole="radiogroup"
                accessibilityLabel={t('documents.form.category')}
                className="flex-row flex-wrap gap-1.5"
              >
                {DOCUMENT_CATEGORIES.map(category => (
                  <Chip
                    key={category}
                    role="radio"
                    label={t(`documents.categories.${category}`)}
                    selected={field.value === category}
                    onPress={() => field.onChange(category)}
                  />
                ))}
              </View>
            </View>
          )}
        />
        {family.children.length > 1 ? (
          <Controller
            control={control}
            name="childId"
            render={({ field }) => (
              <View className="gap-1.5">
                <Text className="font-bold text-[13px] text-text">
                  {t('documents.form.child')}
                </Text>
                <View
                  accessibilityRole="radiogroup"
                  accessibilityLabel={t('documents.form.child')}
                  className="flex-row flex-wrap gap-1.5"
                >
                  {family.children.map(child => (
                    <Chip
                      key={child.id}
                      role="radio"
                      label={child.firstName}
                      selected={field.value === child.id}
                      onPress={() => field.onChange(child.id)}
                    />
                  ))}
                  <Chip
                    role="radio"
                    label={t('documents.form.allChildren')}
                    selected={field.value === null}
                    onPress={() => field.onChange(null)}
                  />
                </View>
              </View>
            )}
          />
        ) : null}
        <Text className="mx-1 font-regular text-[13px] leading-[18px] text-text-secondary">
          {family.solo
            ? t('documents.form.soloHint', { name: other })
            : t('documents.form.hint', { name: other })}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

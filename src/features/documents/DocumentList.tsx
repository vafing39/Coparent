import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Family, FamilyDocument } from '../../api/types';
import { DocumentRow } from './DocumentRow';

type Props = {
  family: Family;
  documents: FamilyDocument[];
  /** Vrai si la famille n'a encore aucun document (sinon : aucun dans cette catégorie). */
  noneYet: boolean;
  otherName: string;
  expandedId: string | null;
  busy: boolean;
  onToggle: (document: FamilyDocument) => void;
  onOpen: (document: FamilyDocument) => void;
  onDelete: (document: FamilyDocument) => void;
};

/** Carte de la liste des documents, ou son état vide. */
export function DocumentList({
  family,
  documents,
  noneYet,
  otherName,
  expandedId,
  busy,
  onToggle,
  onOpen,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  return (
    <View
      accessibilityLabel={t('documents.list.label')}
      className="rounded-[20px] bg-card px-4 py-1"
    >
      {documents.length === 0 ? (
        <View className="items-center gap-1.5 px-2 py-7">
          <Text className="text-center font-bold text-[15px] text-text">
            {noneYet ? t('documents.list.none') : t('documents.list.empty')}
          </Text>
          <Text className="text-center font-regular text-[13px] text-text-secondary">
            {t('documents.list.hint', { name: otherName })}
          </Text>
        </View>
      ) : (
        documents.map((document, index) => (
          <DocumentRow
            key={document.id}
            family={family}
            document={document}
            divider={index > 0}
            expanded={expandedId === document.id}
            busy={busy}
            onToggle={() => onToggle(document)}
            onOpen={() => onOpen(document)}
            onDelete={() => onDelete(document)}
          />
        ))
      )}
    </View>
  );
}

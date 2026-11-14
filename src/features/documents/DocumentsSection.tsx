import React, { useState } from 'react';
import { Alert, Linking, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { documentErrorMessage, documentLinkUrl } from '../../api/documents';
import { nameOf, otherRole } from '../../api/expenses';
import type { Family, FamilyDocument } from '../../api/types';
import { ErrorText } from '../../components/ErrorText';
import { LoadError } from '../../components/LoadError';
import { useDocuments } from '../../hooks/useDocuments';
import { DocumentFilter, DocumentFilters } from './DocumentFilters';
import { DocumentList } from './DocumentList';
import { DocumentsNote } from './DocumentsNote';

/**
 * Section Documents de l'onglet Famille : filtres par catégorie, liste dépliable et mention sur
 * l'historique. « Ouvrir » enregistre la consultation puis ouvre le lien temporaire dans le
 * lecteur du téléphone.
 */
export function DocumentsSection({ family }: { family: Family }) {
  const { t } = useTranslation();
  const {
    documents,
    isLoadingDocuments,
    documentsError,
    reloadDocuments,
    openDocument,
    isOpeningDocument,
    openDocumentError,
    deleteDocument,
    isDeletingDocument,
    deleteDocumentError,
  } = useDocuments();
  const [filter, setFilter] = useState<DocumentFilter>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [openFailed, setOpenFailed] = useState(false);
  const other = nameOf(family, otherRole(family.myRole));

  if (documentsError) {
    return (
      <LoadError
        message={t('documents.loadFailed')}
        onRetry={reloadDocuments}
      />
    );
  }
  if (isLoadingDocuments || !documents) {
    return (
      <View
        accessible
        accessibilityLabel={t('common.loading')}
        className="h-40 rounded-[20px] bg-surface"
      />
    );
  }

  const open = (document: FamilyDocument) => {
    setOpenFailed(false);
    openDocument(document.id, {
      onSuccess: link => {
        Linking.openURL(documentLinkUrl(link)).catch(() => setOpenFailed(true));
      },
    });
  };
  const remove = (document: FamilyDocument) =>
    Alert.alert(
      t('documents.row.deleteTitle'),
      t('documents.row.deleteBody', { title: document.title, name: other }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('documents.row.deleteConfirm'),
          style: 'destructive',
          onPress: () => deleteDocument(document.id),
        },
      ],
    );

  const error = openDocumentError ?? deleteDocumentError;
  return (
    <>
      <DocumentFilters value={filter} onChange={setFilter} />
      {error ? <ErrorText text={documentErrorMessage(error)} /> : null}
      {openFailed ? <ErrorText text={t('documents.row.cannotOpen')} /> : null}
      <DocumentList
        family={family}
        documents={
          filter === 'ALL'
            ? documents
            : documents.filter(d => d.category === filter)
        }
        noneYet={documents.length === 0}
        otherName={other}
        expandedId={expandedId}
        busy={isOpeningDocument || isDeletingDocument}
        onToggle={document =>
          setExpandedId(id => (id === document.id ? null : document.id))
        }
        onOpen={open}
        onDelete={remove}
      />
      <DocumentsNote />
    </>
  );
}

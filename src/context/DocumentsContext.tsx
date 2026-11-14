import React, { createContext, useMemo } from 'react';
import {
  UseMutateFunction,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { DocumentFile, documentKeys } from '../api/documents';
import type {
  DocumentCategory,
  DocumentLink,
  FamilyDocument,
} from '../api/types';
import { useFamily } from '../hooks/useFamily';

// Requêtes HTTP des documents, appelées uniquement par DocumentsProvider.

function documentsPath(familyId: string) {
  return `/api/v1/families/${familyId}/documents`;
}

async function fetchDocuments(familyId: string): Promise<FamilyDocument[]> {
  const { data } = await apiClient.get<FamilyDocument[]>(
    documentsPath(familyId),
  );
  return data;
}

async function uploadDocumentRequest(
  familyId: string,
  { file, title, category, childId }: UploadDocumentVariables,
): Promise<FamilyDocument> {
  const form = new FormData();
  // React Native envoie le fichier local désigné par son uri.
  form.append('file', {
    uri: file.uri,
    type: file.type,
    name: file.name,
  } as unknown as Blob);
  form.append('title', title);
  form.append('category', category);
  if (childId) {
    form.append('childId', childId);
  }
  const { data } = await apiClient.post<FamilyDocument>(
    documentsPath(familyId),
    form,
    { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120_000 },
  );
  return data;
}

async function openDocumentRequest(
  familyId: string,
  documentId: string,
): Promise<DocumentLink> {
  const { data } = await apiClient.post<DocumentLink>(
    `${documentsPath(familyId)}/${documentId}/open`,
  );
  return data;
}

async function deleteDocumentRequest(
  familyId: string,
  documentId: string,
): Promise<void> {
  await apiClient.delete(`${documentsPath(familyId)}/${documentId}`);
}

/** `childId` null : tous les enfants. */
export type UploadDocumentVariables = {
  file: DocumentFile;
  title: string;
  category: DocumentCategory;
  childId: string | null;
};

export type DocumentsContextValue = {
  documents: FamilyDocument[] | undefined;
  isLoadingDocuments: boolean;
  documentsError: Error | null;
  reloadDocuments: () => void;
  uploadDocument: UseMutateFunction<
    FamilyDocument,
    Error,
    UploadDocumentVariables
  >;
  isUploadingDocument: boolean;
  uploadDocumentError: Error | null;
  resetUploadDocument: () => void;
  /** Enregistre l'ouverture et renvoie le lien temporaire, à ouvrir aussitôt. */
  openDocument: UseMutateFunction<DocumentLink, Error, string>;
  isOpeningDocument: boolean;
  openDocumentError: Error | null;
  deleteDocument: UseMutateFunction<void, Error, string>;
  isDeletingDocument: boolean;
  deleteDocumentError: Error | null;
};

export const DocumentsContext = createContext<DocumentsContextValue | null>(
  null,
);

/**
 * Détient les documents partagés de la famille. Après un envoi, une ouverture (nouvelle ligne
 * dans l'historique) ou une suppression, la liste est rechargée.
 */
export function DocumentsProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { family } = useFamily();
  const familyId = family?.id ?? '';

  const {
    data: documents,
    isPending: isLoadingDocuments,
    error: documentsError,
    refetch,
  } = useQuery({
    queryKey: documentKeys.list(familyId),
    queryFn: () => fetchDocuments(familyId),
    enabled: familyId !== '',
  });

  const onChanged = () =>
    queryClient.invalidateQueries({ queryKey: documentKeys.list(familyId) });

  const upload = useMutation({
    mutationFn: (variables: UploadDocumentVariables) =>
      uploadDocumentRequest(familyId, variables),
    onSuccess: onChanged,
  });
  const open = useMutation({
    mutationFn: (documentId: string) =>
      openDocumentRequest(familyId, documentId),
    onSuccess: onChanged,
  });
  const remove = useMutation({
    mutationFn: (documentId: string) =>
      deleteDocumentRequest(familyId, documentId),
    onSuccess: onChanged,
  });

  const value = useMemo<DocumentsContextValue>(
    () => ({
      documents,
      isLoadingDocuments,
      documentsError,
      reloadDocuments: () => {
        refetch();
      },
      uploadDocument: upload.mutate,
      isUploadingDocument: upload.isPending,
      uploadDocumentError: upload.error,
      resetUploadDocument: upload.reset,
      openDocument: open.mutate,
      isOpeningDocument: open.isPending,
      openDocumentError: open.error,
      deleteDocument: remove.mutate,
      isDeletingDocument: remove.isPending,
      deleteDocumentError: remove.error,
    }),
    [
      documents,
      isLoadingDocuments,
      documentsError,
      refetch,
      upload.mutate,
      upload.isPending,
      upload.error,
      upload.reset,
      open.mutate,
      open.isPending,
      open.error,
      remove.mutate,
      remove.isPending,
      remove.error,
    ],
  );
  return (
    <DocumentsContext.Provider value={value}>
      {children}
    </DocumentsContext.Provider>
  );
}

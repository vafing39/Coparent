import { Platform } from 'react-native';
import {
  errorCodes,
  isErrorWithCode,
  pick,
} from '@react-native-documents/picker';
import type { DocumentFile } from '../api/documents';
import { pickReceiptPhoto } from './receiptPhoto';

export type PickedDocument =
  | { file: DocumentFile }
  | { cancelled: true }
  | { error: 'cameraUnavailable' | 'permission' | 'pickFailed' };

/**
 * PDF, JPEG, PNG. iOS attend des identifiants de type Apple (UTI) et grise
 * tout fichier quand on lui passe des types MIME ; Android attend des MIME.
 */
const TYPES = Platform.select({
  ios: ['com.adobe.pdf', 'public.jpeg', 'public.png'],
  default: ['application/pdf', 'image/jpeg', 'image/png'],
});

/** « Choisir un fichier » : un PDF ou une image depuis Fichiers (copiée dans l'app). */
export async function pickDocumentFile(): Promise<PickedDocument> {
  try {
    const [picked] = await pick({ type: TYPES, mode: 'import' });
    if (picked.error || !picked.uri) {
      return { error: 'pickFailed' };
    }
    return {
      file: {
        uri: picked.uri,
        type: picked.type ?? 'application/octet-stream',
        name: picked.name ?? 'document',
        size: picked.size,
      },
    };
  } catch (error) {
    if (
      isErrorWithCode(error) &&
      error.code === errorCodes.OPERATION_CANCELED
    ) {
      return { cancelled: true };
    }
    return { error: 'pickFailed' };
  }
}

/** « Photographier » : appareil photo ou photothèque, comme un justificatif de dépense. */
export async function pickDocumentPhoto(
  source: 'camera' | 'library',
): Promise<PickedDocument> {
  const result = await pickReceiptPhoto(source);
  if ('photo' in result) {
    const { uri, type, fileName } = result.photo;
    return { file: { uri, type, name: fileName, size: null } };
  }
  return result;
}

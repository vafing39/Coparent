import i18n from '../i18n';
import { API_URL } from '../lib/config';
import { ApiError } from './errors';
import { serverDetail } from './exchanges';
import type { DocumentCategory, DocumentLink } from './types';

/**
 * Adresse complète du lien temporaire : la même adresse du backend que le reste
 * de l'app (`API_URL`), donc valable partout où l'app joint le serveur.
 */
export function documentLinkUrl(link: DocumentLink): string {
  return API_URL + link.path;
}

export const documentKeys = {
  list: (familyId: string) => ['documents', familyId, 'list'] as const,
};

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'SCHOOL',
  'INSURANCE',
  'IDENTITY',
  'JUDGMENT',
  'OTHER',
];

/** Taille maximale d'un document, vérifiée aussi par le serveur : 20 Mo. */
export const DOCUMENT_MAX_BYTES = 20 * 1024 * 1024;

/** Fichier choisi pour un document, pas encore envoyé. `size` : null si inconnue. */
export type DocumentFile = {
  uri: string;
  type: string;
  name: string;
  size: number | null;
};

/** « 248 Ko », « 1,2 Mo ». */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`;
}

/** Nom proposé pour le document : le nom du fichier sans son extension. */
export function titleFromFileName(name: string): string {
  return name.replace(/\.[^.]+$/, '').slice(0, 120);
}

/** Message d'échec d'une action sur un document ; les refus du serveur (400, 409) tels quels. */
export function documentErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return i18n.t('documents.errors.gone');
    }
    if (error.status === 413) {
      return i18n.t('documents.errors.tooLarge');
    }
    const detail = serverDetail(error);
    if ((error.status === 400 || error.status === 409) && detail) {
      return detail;
    }
  }
  return i18n.t('errors.network');
}

import { useContext } from 'react';
import {
  DocumentsContext,
  DocumentsContextValue,
} from '../context/DocumentsContext';

/** Documents partagés de la famille (DocumentsProvider). */
export function useDocuments(): DocumentsContextValue {
  const value = useContext(DocumentsContext);
  if (!value) {
    throw new Error(
      'useDocuments doit être utilisé dans un DocumentsProvider.',
    );
  }
  return value;
}

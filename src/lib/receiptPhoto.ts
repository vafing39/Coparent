import {
  CameraOptions,
  ImagePickerResponse,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';
import type { ReceiptPhoto } from '../api/expenses';

/**
 * Le sélecteur réduit la photo à 2000 px et la réencode en JPEG, sans les informations
 * supplémentaires (lieu, date) ; le serveur retire de toute façon toutes les métadonnées.
 */
const OPTIONS: CameraOptions = {
  mediaType: 'photo',
  maxWidth: 2000,
  maxHeight: 2000,
  quality: 0.8,
  includeBase64: false,
  includeExtra: false,
  saveToPhotos: false,
};

export type PickedReceipt =
  | { photo: ReceiptPhoto }
  | { cancelled: true }
  | { error: 'cameraUnavailable' | 'permission' | 'pickFailed' };

/** Prend une photo du justificatif, ou la choisit dans la photothèque. */
export async function pickReceiptPhoto(
  source: 'camera' | 'library',
): Promise<PickedReceipt> {
  let response: ImagePickerResponse;
  try {
    response =
      source === 'camera'
        ? await launchCamera(OPTIONS)
        : await launchImageLibrary({ ...OPTIONS, selectionLimit: 1 });
  } catch {
    return { error: 'pickFailed' };
  }
  if (response.didCancel) {
    return { cancelled: true };
  }
  if (response.errorCode === 'camera_unavailable') {
    return { error: 'cameraUnavailable' };
  }
  if (response.errorCode === 'permission') {
    return { error: 'permission' };
  }
  const asset = response.assets?.[0];
  if (response.errorCode || !asset?.uri) {
    return { error: 'pickFailed' };
  }
  return {
    photo: {
      uri: asset.uri,
      type: asset.type ?? 'image/jpeg',
      fileName: asset.fileName ?? 'justificatif.jpg',
    },
  };
}

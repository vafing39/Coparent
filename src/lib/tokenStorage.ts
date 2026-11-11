import * as Keychain from 'react-native-keychain';

/**
 * Stockage sécurisé (Keychain iOS, Keystore Android) du refresh token.
 * Le jeton d'accès (15 min) reste uniquement en mémoire.
 */
const SERVICE = 'coparent.refreshToken';

export async function saveRefreshToken(token: string): Promise<void> {
  await Keychain.setGenericPassword('refreshToken', token, {
    service: SERVICE,
    // Jamais restauré sur un autre appareil depuis une sauvegarde.
    accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  });
}

export async function loadRefreshToken(): Promise<string | null> {
  const credentials = await Keychain.getGenericPassword({ service: SERVICE });
  return credentials ? credentials.password : null;
}

export async function clearRefreshToken(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE });
}

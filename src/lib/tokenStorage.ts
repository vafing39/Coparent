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

/**
 * Invitation reçue par lien, gardée jusqu'à son acceptation (inscription et vérification
 * de l'email peuvent prendre du temps, l'app peut être fermée entre-temps). Son jeton
 * permet de rejoindre la famille : il va dans le trousseau, comme les jetons de session.
 */
const INVITATION_SERVICE = 'coparent.invitation';

export type StoredInvitation = {
  token: string;
  /** L'invité a choisi de rejoindre depuis l'aperçu : l'acceptation sera automatique. */
  confirmed: boolean;
};

export async function saveInvitation(invitation: StoredInvitation) {
  await Keychain.setGenericPassword('invitation', JSON.stringify(invitation), {
    service: INVITATION_SERVICE,
    accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  });
}

export async function loadInvitation(): Promise<StoredInvitation | null> {
  const credentials = await Keychain.getGenericPassword({
    service: INVITATION_SERVICE,
  });
  if (!credentials) {
    return null;
  }
  try {
    const parsed = JSON.parse(credentials.password) as StoredInvitation;
    return typeof parsed.token === 'string'
      ? { token: parsed.token, confirmed: parsed.confirmed === true }
      : null;
  } catch {
    return null;
  }
}

export async function clearInvitation(): Promise<void> {
  await Keychain.resetGenericPassword({ service: INVITATION_SERVICE });
}

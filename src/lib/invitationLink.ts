import { APP_LINKS_DOMAIN } from './config';

/** Schéma propre à l'app : coparent://invitation?token=… */
export const APP_SCHEME = 'coparent';

/** Jeton du backend : 32 octets en base64url (43 caractères) ; un peu de marge. */
const TOKEN = /^[A-Za-z0-9_-]{20,128}$/;

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Jeton d'invitation d'un lien qui ouvre l'app, ou null si ce n'est pas une invitation.
 * Liens acceptés : coparent://invitation?token=… et, si un domaine est configuré,
 * https://<domaine>/invitation?token=…
 */
export function parseInvitationToken(
  url: string,
  appLinksDomain: string = APP_LINKS_DOMAIN,
): string | null {
  const prefixes = [`${APP_SCHEME}://invitation`];
  if (appLinksDomain) {
    prefixes.push(`https://${escapeRegExp(appLinksDomain)}/invitation`);
  }
  const match = new RegExp(`^(?:${prefixes.join('|')})/?\\?([^#]*)`, 'i').exec(
    url.trim(),
  );
  if (!match) {
    return null;
  }
  for (const pair of match[1].split('&')) {
    const [key, value = ''] = pair.split('=');
    if (key === 'token') {
      try {
        const token = decodeURIComponent(value);
        return TOKEN.test(token) ? token : null;
      } catch {
        return null; // encodage invalide
      }
    }
  }
  return null;
}

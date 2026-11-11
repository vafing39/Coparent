import type { LoginValues } from '../schemas/auth';
import { ApiError } from './errors';

export type Session = {
  accessToken: string;
  refreshToken: string;
};

/**
 * PROVISOIRE : le backend et le client HTTP (axios + react-native-config) ne sont
 * pas encore en place. Remplacer par l'appel réel (types générés depuis l'OpenAPI).
 */
export async function login(_values: LoginValues): Promise<Session> {
  throw new ApiError(null, 'API not configured');
}

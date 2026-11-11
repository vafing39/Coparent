import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_URL } from '../lib/config';
import { useSession } from '../stores/session';
import { ApiError } from './errors';
import { refreshSession } from './session';

/** Client HTTP unique de l'app. Toute requête passe par lui (via TanStack Query). */
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

const AUTH_PATH = '/api/v1/auth/';
/** Routes d'authentification qui exigent une session : un 401 y signifie un jeton expiré. */
const SIGNED_IN_AUTH_PATH = '/api/v1/auth/email/';

/**
 * Un 401 sur connexion, inscription, rafraîchissement, etc. est une vraie réponse (identifiants refusés) :
 * on ne tente pas de rafraîchir la session.
 */
function canRefreshOn401(url: string | undefined): boolean {
  return !url?.startsWith(AUTH_PATH) || url.startsWith(SIGNED_IN_AUTH_PATH);
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

apiClient.interceptors.request.use(config => {
  const { accessToken } = useSession.getState();
  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

/** Un seul rafraîchissement à la fois : les 401 simultanés attendent le même. */
let refreshing: Promise<boolean> | null = null;

function refreshOnce(): Promise<boolean> {
  refreshing ??= refreshSession().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

apiClient.interceptors.response.use(
  response => response,
  async (error: unknown) => {
    const original = (error as AxiosError).config as
      | RetriableConfig
      | undefined;
    const isExpiredSession =
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      original !== undefined &&
      !original._retried &&
      canRefreshOn401(original.url);

    if (isExpiredSession) {
      original._retried = true;
      if (await refreshOnce()) {
        original.headers.Authorization = `Bearer ${
          useSession.getState().accessToken
        }`;
        return apiClient(original);
      }
    }
    throw toApiError(error);
  },
);

/** Convertit toute erreur en ApiError (statut null = le serveur n'a pas répondu). */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: string } | undefined)
      ?.detail;
    return new ApiError(
      error.response?.status ?? null,
      detail ?? error.message,
    );
  }
  return new ApiError(null, String(error));
}

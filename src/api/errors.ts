/** Erreur renvoyée par la couche API, indépendante du client HTTP. */
export class ApiError extends Error {
  constructor(
    /** Statut HTTP, ou null si la requête n'a pas abouti (réseau, service absent). */
    readonly status: number | null,
    message = 'API error',
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

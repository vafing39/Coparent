import type { FamilyValues } from '../schemas/family';
import { apiClient } from './client';
import { ApiError } from './errors';
import type { Family } from './types';

const FAMILIES_PATH = '/api/v1/families';

function toRequest(values: FamilyValues) {
  return { name: values.name, vacationZone: values.zone };
}

/** La famille de l'utilisateur connecté, ou null s'il n'en a pas encore. */
export async function fetchMyFamily(): Promise<Family | null> {
  try {
    const { data } = await apiClient.get<Family>(`${FAMILIES_PATH}/me`);
    return data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

/** Crée la famille ; l'utilisateur en devient le parent A. */
export async function createFamily(values: FamilyValues): Promise<Family> {
  const { data } = await apiClient.post<Family>(
    FAMILIES_PATH,
    toRequest(values),
  );
  return data;
}

/** Modifie le nom et la zone d'une famille existante. */
export async function updateFamily(
  familyId: string,
  values: FamilyValues,
): Promise<Family> {
  const { data } = await apiClient.put<Family>(
    `${FAMILIES_PATH}/${familyId}`,
    toRequest(values),
  );
  return data;
}

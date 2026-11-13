import i18n from '../i18n';
import { ApiError } from './errors';
import { todayInParis } from '../lib/dates';
import type { ToDoItem } from './types';

export const toDoKeys = {
  list: (familyId: string) => ['toDo', familyId] as const,
};

/** Relancé aujourd'hui (jour de Paris) : la prochaine relance n'est possible que demain. */
export function nudgedToday(item: ToDoItem, now: Date = new Date()): boolean {
  return (
    item.lastNudgedAt !== null &&
    todayInParis(new Date(item.lastNudgedAt)) === todayInParis(now)
  );
}

/** Message d'échec de « Relancer ». */
export function nudgeErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) {
      return i18n.t('home.toDo.errors.oncePerDay');
    }
    if (error.status === 404 || error.status === 409) {
      return i18n.t('home.toDo.errors.gone');
    }
  }
  return i18n.t('errors.network');
}

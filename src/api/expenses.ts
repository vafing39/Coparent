import i18n from '../i18n';
import type { Expense, Family, FamilyRole } from './types';
import { ApiError } from './errors';
import { serverDetail } from './exchanges';

export const expenseKeys = {
  all: (familyId: string) => ['expenses', familyId] as const,
  list: (familyId: string) => ['expenses', familyId, 'list'] as const,
  balance: (familyId: string) => ['expenses', familyId, 'balance'] as const,
};

/** Image du justificatif d'une dépense (GET pour la voir, PUT multipart pour l'envoyer). */
export function receiptPath(familyId: string, expenseId: string): string {
  return `/api/v1/families/${familyId}/expenses/${expenseId}/receipt`;
}

/**
 * Photo choisie pour le justificatif, pas encore envoyée : fichier local (déjà réduit et
 * réencodé en JPEG par le sélecteur).
 */
export type ReceiptPhoto = { uri: string; type: string; fileName: string };

/**
 * La dépense est enregistrée mais pas son justificatif : le formulaire reste ouvert, sur cette
 * dépense, pour réessayer sans la créer deux fois.
 */
export class ReceiptUploadError extends Error {
  constructor(readonly expense: Expense, readonly cause: unknown) {
    super('receipt upload failed');
    this.name = 'ReceiptUploadError';
  }
}

/** Montant maximal d'une dépense, vérifié aussi par le serveur : 100 000 €. */
export const MAX_AMOUNT_CENTS = 10_000_000;

/** Part du payeur proposée : 50/50, 60/40, 70/30, tout pour lui, ou l'inverse. */
export const PAYER_SHARES = [50, 60, 70, 100, 40, 30, 0] as const;

/** « 42,50 € », « 1 250,00 € » (espace insécable avant le symbole et entre les milliers). */
export function formatEuros(cents: number): string {
  const sign = cents < 0 ? '−' : '';
  const abs = Math.abs(cents);
  const euros = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const rest = (abs % 100).toString().padStart(2, '0');
  return `${sign}${euros},${rest} €`;
}

/**
 * Saisie d'un montant (« 64,20 », « 64.2 », « 64 € ») → centimes, ou null si ce n'est pas un
 * montant (deux décimales au plus).
 */
export function parseAmount(text: string): number | null {
  const cleaned = text.replace(/[\s  €]/g, '').replace(',', '.');
  const match = cleaned.match(/^(\d{1,9})(?:\.(\d{1,2}))?$/);
  if (!match) {
    return null;
  }
  return Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
}

/** Centimes → texte du champ montant : 6420 → « 64,20 ». */
export function amountInput(cents: number): string {
  return `${Math.floor(cents / 100)},${(cents % 100)
    .toString()
    .padStart(2, '0')}`;
}

export function otherRole(role: FamilyRole): FamilyRole {
  return role === 'PARENT_A' ? 'PARENT_B' : 'PARENT_A';
}

/** Part du parent qui n'a pas payé, arrondie au centime comme le serveur (indicatif). */
export function owedCents(amountCents: number, payerShare: number): number {
  return Math.round((amountCents * (100 - payerShare)) / 100);
}

/**
 * Répartition lisible : « 50/50 », « Camille 70 % · Julien 30 % », « À la charge de Camille ».
 */
export function splitLabel(
  payerShare: number,
  payerName: string,
  otherName: string,
): string {
  if (payerShare === 50) {
    return i18n.t('expenses.split.even');
  }
  if (payerShare === 100) {
    return i18n.t('expenses.split.all', { name: payerName });
  }
  if (payerShare === 0) {
    return i18n.t('expenses.split.all', { name: otherName });
  }
  return i18n.t('expenses.split.shares', {
    payer: payerName,
    payerShare,
    other: otherName,
    otherShare: 100 - payerShare,
  });
}

/**
 * Prénom d'un parent. S'il n'a pas encore rejoint : le prénom donné à l'invitation, sinon
 * « l'autre parent ».
 */
export function nameOf(family: Family, role: FamilyRole): string {
  return (
    family.members.find(member => member.role === role)?.firstName ??
    family.invitation?.inviteeFirstName ??
    i18n.t('home.otherParent')
  );
}

/**
 * Message d'échec d'une action sur une dépense ou un virement. Les refus du serveur (400, 409 :
 * montant, répartition, dépense déjà traitée…) ont un texte précis, affiché tel quel.
 */
export function expenseErrorMessage(error: unknown): string {
  if (error instanceof ReceiptUploadError) {
    const detail =
      error.cause instanceof ApiError && error.cause.status === 400
        ? serverDetail(error.cause)
        : null;
    return detail ?? i18n.t('expenses.receipt.uploadFailed');
  }
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return i18n.t('expenses.errors.gone');
    }
    const detail = serverDetail(error);
    if ((error.status === 400 || error.status === 409) && detail) {
      return detail;
    }
    if (error.status === 400) {
      return i18n.t('expenses.errors.invalid');
    }
  }
  return i18n.t('errors.network');
}

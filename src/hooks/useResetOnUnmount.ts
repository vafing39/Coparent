import { useEffect } from 'react';

/**
 * Les mutations vivent dans les contextes : leur état (erreur, succès) est partagé.
 * Un écran les remet à zéro en se fermant, pour ne pas retrouver une ancienne erreur au retour.
 * Ex. : useResetOnUnmount(resetLogin).
 */
export function useResetOnUnmount(...resets: (() => void)[]) {
  useEffect(
    () => () => resets.forEach(reset => reset()),
    // Les fonctions reset sont stables.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    resets,
  );
}

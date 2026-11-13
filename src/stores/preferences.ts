import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Apparence choisie : celle du téléphone, ou toujours claire, ou toujours sombre. */
export type Appearance = 'system' | 'light' | 'dark';

/**
 * Préférences de ce téléphone (cahier des charges, 4 et 11), sans appel d'API : rangées dans
 * AsyncStorage (rien de sensible), gardées après une déconnexion.
 */
type PreferencesState = {
  appearance: Appearance;
  /** Les couleurs des deux parents sont interverties, sur ce téléphone seulement. */
  swapParentColors: boolean;
  setAppearance: (appearance: Appearance) => void;
  toggleSwapParentColors: () => void;
};

export const usePreferences = create<PreferencesState>()(
  persist(
    set => ({
      appearance: 'system',
      swapParentColors: false,
      setAppearance: appearance => set({ appearance }),
      toggleSwapParentColors: () =>
        set(state => ({ swapParentColors: !state.swapParentColors })),
    }),
    {
      name: 'coparent-preferences',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ appearance, swapParentColors }) => ({
        appearance,
        swapParentColors,
      }),
    },
  ),
);

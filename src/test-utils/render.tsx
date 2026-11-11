import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { FamilyProvider } from '../context/FamilyContext';
import { OnboardingDraftProvider } from '../context/OnboardingDraftContext';

type Options = {
  /** Entoure aussi de FamilyProvider et OnboardingDraftProvider (étapes de la première connexion). */
  onboarding?: boolean;
};

/** Rend un écran avec les mêmes fournisseurs que l'app (requêtes sans nouvel essai). */
export async function renderWithProviders(
  ui: React.ReactElement,
  { onboarding = false }: Options = {},
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const content = onboarding ? (
    <FamilyProvider>
      <OnboardingDraftProvider>{ui}</OnboardingDraftProvider>
    </FamilyProvider>
  ) : (
    ui
  );
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>{content}</AuthProvider>
    </QueryClientProvider>,
  );
}

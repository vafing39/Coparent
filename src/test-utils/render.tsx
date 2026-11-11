import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { FamilyProvider } from '../context/FamilyContext';
import { InvitationProvider } from '../context/InvitationContext';
import { OnboardingDraftProvider } from '../context/OnboardingDraftContext';

type Options = {
  /** Entoure aussi de FamilyProvider et OnboardingDraftProvider (étapes de la première connexion). */
  onboarding?: boolean;
  /** Fin de la première connexion (étape 5). */
  onFinishOnboarding?: () => void;
};

/** Rend un écran avec les mêmes fournisseurs que l'app (requêtes sans nouvel essai). */
export async function renderWithProviders(
  ui: React.ReactElement,
  { onboarding = false, onFinishOnboarding = () => undefined }: Options = {},
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const content = onboarding ? (
    <FamilyProvider>
      <OnboardingDraftProvider onFinish={onFinishOnboarding}>
        {ui}
      </OnboardingDraftProvider>
    </FamilyProvider>
  ) : (
    ui
  );
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <InvitationProvider>{content}</InvitationProvider>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

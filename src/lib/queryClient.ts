import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2 },
    // Une action de l'utilisateur n'est jamais rejouée automatiquement.
    mutations: { retry: false },
  },
});

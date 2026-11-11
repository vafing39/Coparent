import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FamilleScreen } from '../FamilleScreen';
import { OnboardingNavigator } from '../../../navigation/OnboardingNavigator';
import {
  createFamily,
  fetchMyFamily,
  updateFamily,
} from '../../../api/familyRequests';
import { ApiError } from '../../../api/errors';
import { family } from '../../../test-utils/familyFixtures';

jest.mock('../../../api/familyRequests', () => ({
  fetchMyFamily: jest.fn(),
  createFamily: jest.fn(),
  updateFamily: jest.fn(),
}));

const mockedFetch = fetchMyFamily as jest.MockedFunction<typeof fetchMyFamily>;
const mockedCreate = createFamily as jest.MockedFunction<typeof createFamily>;
const mockedUpdate = updateFamily as jest.MockedFunction<typeof updateFamily>;

const navigate = jest.fn();

function withQueryClient(children: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const props = {
  navigation: { navigate },
  route: { key: 'Famille', name: 'Famille' },
} as unknown as React.ComponentProps<typeof FamilleScreen>;

/** Rend l'écran ; par défaut, attend la fin du chargement de la famille. */
async function renderScreen({ waitForForm = true } = {}) {
  await render(withQueryClient(<FamilleScreen {...props} />));
  if (waitForForm) {
    await screen.findByRole('header', { name: 'Créez votre famille' });
  }
}

async function renderNavigator() {
  await render(
    withQueryClient(
      <NavigationContainer>
        <OnboardingNavigator emailVerified />
      </NavigationContainer>,
    ),
  );
}

async function fillForm(name = 'Famille Martin', zone = 'Zone A') {
  await fireEvent.changeText(screen.getByLabelText('Nom de la famille'), name);
  await fireEvent.press(screen.getByRole('radio', { name: zone }));
}

async function submit() {
  await fireEvent.press(screen.getByRole('button', { name: 'Continuer' }));
}

beforeEach(() => {
  navigate.mockClear();
  mockedFetch.mockReset().mockResolvedValue(null);
  mockedCreate.mockReset().mockResolvedValue(family());
  mockedUpdate.mockReset();
});

test('affiche le titre et l’étape 2 sur 5', async () => {
  await renderScreen();
  expect(screen.getByRole('progressbar')).toHaveAccessibilityValue({
    now: 2,
    max: 5,
  });
  expect(screen.getAllByRole('radio')).toHaveLength(4);
});

test('chargement : squelette tant que la famille n’est pas récupérée', async () => {
  mockedFetch.mockReturnValue(new Promise(() => undefined));
  await renderScreen({ waitForForm: false });
  expect(screen.getByLabelText('Chargement')).toBeOnTheScreen();
  expect(screen.queryByLabelText('Nom de la famille')).toBeNull();
});

test('erreur de chargement : message et « Réessayer »', async () => {
  mockedFetch.mockRejectedValueOnce(new ApiError(null));
  await renderScreen({ waitForForm: false });
  expect(
    await screen.findByText(/Impossible de récupérer votre famille/),
  ).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Réessayer' }));
  expect(
    await screen.findByRole('header', { name: 'Créez votre famille' }),
  ).toBeOnTheScreen();
  expect(mockedFetch).toHaveBeenCalledTimes(2);
});

test('le bouton d’information affiche les académies de chaque zone', async () => {
  await renderScreen();
  expect(screen.queryByText('Les zones de vacances scolaires')).toBeNull();
  await fireEvent.press(
    screen.getByRole('button', { name: 'En savoir plus sur les zones' }),
  );
  expect(
    await screen.findByRole('header', {
      name: 'Les zones de vacances scolaires',
    }),
  ).toBeOnTheScreen();
  expect(
    screen.getByText('Créteil, Montpellier, Paris, Toulouse, Versailles'),
  ).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Fermer' }));
  await waitFor(() =>
    expect(screen.queryByText('Les zones de vacances scolaires')).toBeNull(),
  );
});

test('ouvrir et fermer l’information ne change pas la zone choisie', async () => {
  await renderScreen();
  await fireEvent.press(screen.getByRole('radio', { name: 'Zone B' }));
  await fireEvent.press(
    screen.getByRole('button', { name: 'En savoir plus sur les zones' }),
  );
  await fireEvent.press(await screen.findByRole('button', { name: 'Fermer' }));
  await waitFor(() =>
    expect(screen.getByRole('radio', { name: 'Zone B' })).toBeChecked(),
  );
});

test('formulaire vide : erreurs sur le nom et la zone, aucun appel', async () => {
  await renderScreen();
  await submit();
  expect(
    await screen.findByText('Saisissez le nom de la famille.'),
  ).toBeOnTheScreen();
  expect(
    screen.getByText('Choisissez une zone de vacances scolaires.'),
  ).toBeOnTheScreen();
  expect(mockedCreate).not.toHaveBeenCalled();
  expect(navigate).not.toHaveBeenCalled();
});

test('aucune zone choisie par défaut, une seule à la fois', async () => {
  await renderScreen();
  for (const radio of screen.getAllByRole('radio')) {
    expect(radio).not.toBeChecked();
  }
  await fireEvent.press(screen.getByRole('radio', { name: 'Zone B' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Zone C' }));
  expect(screen.getByRole('radio', { name: 'Zone C' })).toBeChecked();
  expect(screen.getByRole('radio', { name: 'Zone B' })).not.toBeChecked();
});

test('nom fait d’espaces : refusé', async () => {
  await renderScreen();
  await fillForm('   ', 'Autre');
  await submit();
  expect(
    await screen.findByText('Saisissez le nom de la famille.'),
  ).toBeOnTheScreen();
  expect(mockedCreate).not.toHaveBeenCalled();
});

test('pas encore de famille : la crée puis passe à l’étape des enfants', async () => {
  await renderScreen();
  await fillForm('  Famille Martin ');
  await submit();
  await waitFor(() => expect(navigate).toHaveBeenCalledWith('Enfants'));
  expect(mockedCreate.mock.calls[0][0]).toEqual({
    name: 'Famille Martin',
    zone: 'A',
  });
  expect(mockedUpdate).not.toHaveBeenCalled();
});

test('famille existante : formulaire prérempli, enregistrement en modification', async () => {
  const existing = family({ name: 'Famille Durand', vacationZone: 'C' });
  mockedFetch.mockResolvedValue(existing);
  mockedUpdate.mockResolvedValue({ ...existing, vacationZone: 'B' });
  await renderScreen();
  expect(screen.getByLabelText('Nom de la famille')).toHaveDisplayValue(
    'Famille Durand',
  );
  expect(screen.getByRole('radio', { name: 'Zone C' })).toBeChecked();
  await fireEvent.press(screen.getByRole('radio', { name: 'Zone B' }));
  await submit();
  await waitFor(() => expect(navigate).toHaveBeenCalledWith('Enfants'));
  expect(mockedUpdate).toHaveBeenCalledWith(existing.id, {
    name: 'Famille Durand',
    zone: 'B',
  });
  expect(mockedCreate).not.toHaveBeenCalled();
});

test('déjà dans une famille (409) : message, pas de navigation', async () => {
  mockedCreate.mockRejectedValue(new ApiError(409));
  await renderScreen();
  await fillForm();
  await submit();
  expect(
    await screen.findByText("Vous faites déjà partie d'une famille."),
  ).toBeOnTheScreen();
  expect(navigate).not.toHaveBeenCalled();
});

test('serveur injoignable : message réseau, pas de navigation', async () => {
  mockedCreate.mockRejectedValue(new ApiError(null));
  await renderScreen();
  await fillForm();
  await submit();
  expect(await screen.findByText(/Connexion impossible/)).toBeOnTheScreen();
  expect(navigate).not.toHaveBeenCalled();
});

test('email vérifié : la première connexion s’ouvre sur la famille', async () => {
  await renderNavigator();
  expect(
    await screen.findByRole('header', { name: 'Créez votre famille' }),
  ).toBeOnTheScreen();
});

test('pas de flèche de retour à l’étape 2', async () => {
  await renderScreen();
  expect(screen.queryByRole('button', { name: 'Retour' })).toBeNull();
});

test('retour depuis l’étape 3 : valeurs conservées, renvoi en modification', async () => {
  // Pas de famille à l'ouverture ; l'étape 3 relit ensuite la famille créée.
  mockedFetch.mockResolvedValueOnce(null).mockResolvedValue(family());
  mockedUpdate.mockResolvedValue(family({ vacationZone: 'B' }));
  await renderNavigator();
  await fireEvent.changeText(
    await screen.findByLabelText('Nom de la famille'),
    'Famille Martin',
  );
  await fireEvent.press(screen.getByRole('radio', { name: 'Zone A' }));
  await submit();
  await fireEvent.press(await screen.findByRole('button', { name: 'Retour' }));
  expect(
    await screen.findByRole('header', { name: 'Créez votre famille' }),
  ).toBeOnTheScreen();
  expect(screen.getByLabelText('Nom de la famille')).toHaveDisplayValue(
    'Famille Martin',
  );
  await fireEvent.press(screen.getByRole('radio', { name: 'Zone B' }));
  await submit();
  await waitFor(() => expect(mockedUpdate).toHaveBeenCalledTimes(1));
  expect(mockedCreate).toHaveBeenCalledTimes(1);
});

import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EnfantsScreen } from '../EnfantsScreen';
import {
  addChild,
  deleteChild,
  fetchMyFamily,
  updateChild,
} from '../../../api/familyRequests';
import { ApiError } from '../../../api/errors';
import type { Child } from '../../../api/types';
import { family } from '../../../test-utils/familyFixtures';

jest.mock('../../../api/familyRequests', () => ({
  fetchMyFamily: jest.fn(),
  addChild: jest.fn(),
  updateChild: jest.fn(),
  deleteChild: jest.fn(),
}));

const mockedFetch = fetchMyFamily as jest.MockedFunction<typeof fetchMyFamily>;
const mockedAdd = addChild as jest.MockedFunction<typeof addChild>;
const mockedUpdate = updateChild as jest.MockedFunction<typeof updateChild>;
const mockedDelete = deleteChild as jest.MockedFunction<typeof deleteChild>;

const navigate = jest.fn();
const goBack = jest.fn();
const props = {
  navigation: { navigate, goBack },
  route: { key: 'Enfants', name: 'Enfants' },
} as unknown as React.ComponentProps<typeof EnfantsScreen>;

const FAMILY_ID = family().id;
const lea: Child = {
  id: 'child-lea',
  firstName: 'Léa',
  birthDate: '2018-03-03',
};
const hugo: Child = {
  id: 'child-hugo',
  firstName: 'Hugo',
  birthDate: '2021-08-21',
};

async function renderScreen({ waitForForm = true } = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  await render(
    <QueryClientProvider client={client}>
      <EnfantsScreen {...props} />
    </QueryClientProvider>,
  );
  if (waitForForm) {
    await screen.findByRole('header', { name: 'Ajoutez vos enfants' });
  }
}

const firstNames = () => screen.getAllByLabelText('Prénom');
const birthDates = () => screen.getAllByLabelText('Date de naissance');

async function fillChild(index: number, firstName: string, birthDate: string) {
  await fireEvent.changeText(firstNames()[index], firstName);
  await fireEvent.changeText(birthDates()[index], birthDate);
}

async function submit() {
  await fireEvent.press(screen.getByRole('button', { name: 'Continuer' }));
}

let nextId = 0;
beforeEach(() => {
  navigate.mockClear();
  goBack.mockClear();
  mockedFetch.mockReset().mockResolvedValue(family());
  mockedAdd.mockReset().mockImplementation(async (_familyId, child) => ({
    id: `new-${++nextId}`,
    ...child,
  }));
  mockedUpdate
    .mockReset()
    .mockImplementation(async (_familyId, id, child) => ({ id, ...child }));
  mockedDelete.mockReset().mockResolvedValue();
});

test('étape 3 sur 5, avec retour vers l’étape 2', async () => {
  await renderScreen();
  expect(screen.getByRole('progressbar')).toHaveAccessibilityValue({
    now: 3,
    max: 5,
  });
  await fireEvent.press(screen.getByRole('button', { name: 'Retour' }));
  expect(goBack).toHaveBeenCalled();
});

test('sans enfant enregistré : une carte vide, impossible à retirer', async () => {
  await renderScreen();
  expect(screen.getByText('Enfant 1')).toBeOnTheScreen();
  expect(firstNames()).toHaveLength(1);
  expect(
    screen.queryByRole('button', { name: "Retirer l'enfant 1" }),
  ).toBeNull();
});

test('champs vides : erreurs, aucun appel', async () => {
  await renderScreen();
  await submit();
  expect(
    await screen.findByText("Saisissez le prénom de l'enfant."),
  ).toBeOnTheScreen();
  expect(screen.getByText('Saisissez la date de naissance.')).toBeOnTheScreen();
  expect(mockedAdd).not.toHaveBeenCalled();
});

test('la date se met en forme pendant la saisie', async () => {
  await renderScreen();
  await fireEvent.changeText(birthDates()[0], '03032018');
  expect(birthDates()[0]).toHaveDisplayValue('03/03/2018');
});

test('date qui n’existe pas : refusée', async () => {
  await renderScreen();
  await fillChild(0, 'Léa', '31/02/2020');
  await submit();
  expect(await screen.findByText(/Date invalide/)).toBeOnTheScreen();
  expect(mockedAdd).not.toHaveBeenCalled();
});

test('deux enfants : deux créations, puis étape 4', async () => {
  await renderScreen();
  await fillChild(0, 'Léa', '03/03/2018');
  await fireEvent.press(
    screen.getByRole('button', { name: 'Ajouter un enfant' }),
  );
  expect(screen.getByText('Enfant 2')).toBeOnTheScreen();
  await fillChild(1, 'Hugo', '21/08/2021');
  await submit();
  await waitFor(() => expect(navigate).toHaveBeenCalledWith('Rythme'));
  expect(mockedAdd.mock.calls).toEqual([
    [FAMILY_ID, { firstName: 'Léa', birthDate: '2018-03-03' }],
    [FAMILY_ID, { firstName: 'Hugo', birthDate: '2021-08-21' }],
  ]);
});

test('retirer une carte non enregistrée : aucun appel pour elle', async () => {
  await renderScreen();
  await fillChild(0, 'Léa', '03/03/2018');
  await fireEvent.press(
    screen.getByRole('button', { name: 'Ajouter un enfant' }),
  );
  await fireEvent.press(
    screen.getByRole('button', { name: "Retirer l'enfant 2" }),
  );
  await submit();
  await waitFor(() => expect(navigate).toHaveBeenCalledWith('Rythme'));
  expect(mockedAdd).toHaveBeenCalledTimes(1);
});

test('enfants déjà enregistrés : préremplis ; modifié, retiré, inchangé', async () => {
  mockedFetch.mockResolvedValue(family({ children: [lea, hugo] }));
  await renderScreen();
  expect(firstNames()[0]).toHaveDisplayValue('Léa');
  expect(birthDates()[1]).toHaveDisplayValue('21/08/2021');

  // Léa : prénom modifié ; Hugo : retiré.
  await fireEvent.changeText(firstNames()[0], 'Léana');
  await fireEvent.press(
    screen.getByRole('button', { name: "Retirer l'enfant 2" }),
  );
  await submit();
  await waitFor(() => expect(navigate).toHaveBeenCalledWith('Rythme'));
  expect(mockedUpdate).toHaveBeenCalledWith(FAMILY_ID, lea.id, {
    firstName: 'Léana',
    birthDate: '2018-03-03',
  });
  expect(mockedDelete).toHaveBeenCalledWith(FAMILY_ID, hugo.id);
  expect(mockedAdd).not.toHaveBeenCalled();
});

test('rien de modifié : aucun appel, passe à l’étape 4', async () => {
  mockedFetch.mockResolvedValue(family({ children: [lea] }));
  await renderScreen();
  await submit();
  await waitFor(() => expect(navigate).toHaveBeenCalledWith('Rythme'));
  expect(mockedAdd).not.toHaveBeenCalled();
  expect(mockedUpdate).not.toHaveBeenCalled();
  expect(mockedDelete).not.toHaveBeenCalled();
});

test('échec du 2e enfant : message ; le nouvel essai ne recrée pas le 1er', async () => {
  mockedAdd
    .mockResolvedValueOnce(lea)
    .mockRejectedValueOnce(new ApiError(null));
  // À l'ouverture, aucun enfant ; après l'échec, la famille rechargée contient Léa.
  mockedFetch
    .mockResolvedValueOnce(family())
    .mockResolvedValue(family({ children: [lea] }));
  await renderScreen();
  await fillChild(0, 'Léa', '03/03/2018');
  await fireEvent.press(
    screen.getByRole('button', { name: 'Ajouter un enfant' }),
  );
  await fillChild(1, 'Hugo', '21/08/2021');
  await submit();
  expect(await screen.findByText(/Connexion impossible/)).toBeOnTheScreen();
  expect(navigate).not.toHaveBeenCalled();

  await waitFor(() => expect(mockedFetch).toHaveBeenCalledTimes(2));
  await submit();
  await waitFor(() => expect(navigate).toHaveBeenCalledWith('Rythme'));
  expect(mockedAdd).toHaveBeenCalledTimes(3);
  expect(mockedAdd.mock.calls[2][1]).toEqual({
    firstName: 'Hugo',
    birthDate: '2021-08-21',
  });
  expect(mockedUpdate).not.toHaveBeenCalled();
});

test('chargement : squelette', async () => {
  mockedFetch.mockReturnValue(new Promise(() => undefined));
  await renderScreen({ waitForForm: false });
  expect(screen.getByLabelText('Chargement')).toBeOnTheScreen();
});

test('erreur de chargement : message et « Réessayer »', async () => {
  mockedFetch.mockRejectedValueOnce(new ApiError(null));
  await renderScreen({ waitForForm: false });
  expect(
    await screen.findByText(/Impossible de récupérer votre famille/),
  ).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Réessayer' }));
  expect(
    await screen.findByRole('header', { name: 'Ajoutez vos enfants' }),
  ).toBeOnTheScreen();
});

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, screen } from '@testing-library/react-native';
import { TabsNavigator } from '../TabsNavigator';
import { useSession } from '../../stores/session';
import { authResponse } from '../../test-utils/authFixtures';
import { renderWithProviders } from '../../test-utils/render';

jest.mock('../../api/client', () =>
  jest.requireActual('../../test-utils/fakeApiClient'),
);

const TABS = ['Accueil', 'Calendrier', 'Messages', 'Famille', 'Dépenses'];

async function renderTabs() {
  await renderWithProviders(
    <NavigationContainer>
      <TabsNavigator />
    </NavigationContainer>,
  );
}

beforeEach(async () => {
  await useSession.getState().signIn(authResponse());
});

test('affiche les 5 onglets, Accueil sélectionné', async () => {
  await renderTabs();
  for (const name of TABS) {
    expect(screen.getByRole('button', { name })).toBeOnTheScreen();
  }
  expect(screen.getByRole('button', { name: 'Accueil' })).toBeSelected();
  expect(
    screen.getByRole('header', { name: 'Bonjour Camille' }),
  ).toBeOnTheScreen();
});

test.each([
  ['Calendrier', 'Le calendrier de garde arrive bientôt.'],
  ['Messages', 'La messagerie entre parents arrive bientôt.'],
  [
    'Famille',
    'Bientôt, retrouvez ici les membres de la famille et les informations des enfants.',
  ],
  ['Dépenses', 'Bientôt, partagez ici les dépenses des enfants.'],
])('l’onglet %s ouvre son écran', async (name, text) => {
  await renderTabs();
  await fireEvent.press(screen.getByRole('button', { name }));
  expect(await screen.findByRole('header', { name })).toBeOnTheScreen();
  expect(screen.getByText(text)).toBeOnTheScreen();
  expect(screen.getByRole('button', { name })).toBeSelected();
});

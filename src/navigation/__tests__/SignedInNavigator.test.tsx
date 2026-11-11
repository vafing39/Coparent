import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { screen } from '@testing-library/react-native';
import { SignedInNavigator } from '../SignedInNavigator';
import type { Child, CustodySchedule } from '../../api/types';
import { useSession } from '../../stores/session';
import { authResponse } from '../../test-utils/authFixtures';
import { familyApi } from '../../test-utils/fakeApiClient';
import { family } from '../../test-utils/familyFixtures';
import { renderWithProviders } from '../../test-utils/render';

jest.mock('../../api/client', () =>
  jest.requireActual('../../test-utils/fakeApiClient'),
);

const lea: Child = {
  id: 'c1',
  firstName: 'Léa',
  birthDate: '2018-03-02',
};

async function renderNavigator() {
  await renderWithProviders(
    <NavigationContainer>
      <SignedInNavigator emailVerified />
    </NavigationContainer>,
  );
}

beforeEach(async () => {
  familyApi.fetchMyFamily.mockReset();
  await useSession.getState().signIn(authResponse());
});

test('famille avec enfants et rythme : ouvre l’app', async () => {
  familyApi.fetchMyFamily.mockResolvedValue(
    family({
      children: [lea],
      custodySchedule: { id: 's1' } as CustodySchedule,
    }),
  );
  await renderNavigator();
  expect(
    await screen.findByRole('header', { name: 'Bonjour Camille' }),
  ).toBeOnTheScreen();
});

test('famille sans rythme : reprend la première connexion', async () => {
  familyApi.fetchMyFamily.mockResolvedValue(family({ children: [lea] }));
  await renderNavigator();
  expect(
    await screen.findByRole('header', { name: 'Créez votre famille' }),
  ).toBeOnTheScreen();
});

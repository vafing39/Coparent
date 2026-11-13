import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { WelcomeScreen } from '../WelcomeScreen';
import type { Family } from '../../../api/types';
import { FamilyProvider } from '../../../context/FamilyContext';
import { useSession } from '../../../stores/session';
import { authResponse } from '../../../test-utils/authFixtures';
import { familyApi } from '../../../test-utils/fakeApiClient';
import { family } from '../../../test-utils/familyFixtures';
import { renderWithProviders } from '../../../test-utils/render';

jest.mock('../../../api/client', () =>
  jest.requireActual('../../../test-utils/fakeApiClient'),
);

const TWO_PARENTS: Family = family({
  solo: false,
  members: [
    { userId: 'u1', firstName: 'Camille', role: 'PARENT_A' },
    { userId: 'u2', firstName: 'Julien', role: 'PARENT_B' },
  ],
});

const goBack = jest.fn();
const props = {
  navigation: { goBack },
  route: { key: 'Welcome', name: 'Welcome' },
} as unknown as React.ComponentProps<typeof WelcomeScreen>;

beforeEach(async () => {
  goBack.mockReset();
  familyApi.fetchMyFamily.mockResolvedValue(TWO_PARENTS);
  await useSession.getState().signIn(authResponse());
});

test('le message de Coparent, aux deux prénoms, sans réponse possible', async () => {
  await renderWithProviders(
    <FamilyProvider>
      <WelcomeScreen {...props} />
    </FamilyProvider>,
  );
  expect(
    await screen.findByRole('header', { name: 'Bienvenue' }),
  ).toBeOnTheScreen();
  expect(screen.getByText('Message de Coparent · épinglé')).toBeOnTheScreen();
  expect(screen.getByText(/^Bonjour Camille 👋/)).toBeOnTheScreen();
  expect(
    screen.getByText(/Bienvenue dans votre messagerie avec Julien\./),
  ).toBeOnTheScreen();
  expect(
    screen.getByText('On ne peut pas répondre à ce message.'),
  ).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Envoyer' })).toBeNull();
  expect(screen.queryByPlaceholderText(/Écrire à/)).toBeNull();

  await fireEvent.press(screen.getByRole('button', { name: 'Retour' }));
  expect(goBack).toHaveBeenCalled();
});

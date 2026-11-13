import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { ReglagesScreen } from '../ReglagesScreen';
import type { Family } from '../../../api/types';
import { FamilyProvider } from '../../../context/FamilyContext';
import { usePreferences } from '../../../stores/preferences';
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
  route: { key: 'Reglages', name: 'Reglages' },
} as unknown as React.ComponentProps<typeof ReglagesScreen>;

async function renderScreen() {
  await renderWithProviders(
    <FamilyProvider>
      <ReglagesScreen {...props} />
    </FamilyProvider>,
  );
  await screen.findByRole('header', { name: 'Réglages' });
}

beforeEach(async () => {
  goBack.mockReset();
  usePreferences.setState({ appearance: 'system', swapParentColors: false });
  familyApi.fetchMyFamily.mockResolvedValue(TWO_PARENTS);
  await useSession.getState().signIn(authResponse());
});

test('apparence : « Automatique » par défaut, « Sombre » choisi', async () => {
  await renderScreen();
  expect(screen.getByRole('radio', { name: 'Automatique' })).toBeChecked();
  await fireEvent.press(screen.getByRole('radio', { name: 'Sombre' }));
  expect(screen.getByRole('radio', { name: 'Sombre' })).toBeChecked();
  expect(screen.getByRole('radio', { name: 'Automatique' })).not.toBeChecked();
  expect(usePreferences.getState().appearance).toBe('dark');
});

test('couleurs du calendrier : les deux parents, intervertir, sur ce téléphone seulement', async () => {
  await renderScreen();
  expect(screen.getByText('Camille')).toBeOnTheScreen();
  expect(screen.getByText('Julien')).toBeOnTheScreen();
  expect(
    screen.getByText("Ce choix ne s'applique qu'à votre téléphone."),
  ).toBeOnTheScreen();

  await fireEvent.press(
    screen.getByRole('button', { name: 'Intervertir les couleurs' }),
  );
  expect(usePreferences.getState().swapParentColors).toBe(true);
  await fireEvent.press(
    screen.getByRole('button', { name: 'Intervertir les couleurs' }),
  );
  expect(usePreferences.getState().swapParentColors).toBe(false);
});

test('retour', async () => {
  await renderScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Retour' }));
  expect(goBack).toHaveBeenCalled();
});

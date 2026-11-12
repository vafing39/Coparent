import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { ATraiterScreen } from '../ATraiterScreen';
import { renderWithProviders } from '../../../test-utils/render';

const goBack = jest.fn();
const props = {
  navigation: { goBack },
  route: { key: 'ATraiter', name: 'ATraiter' },
} as unknown as React.ComponentProps<typeof ATraiterScreen>;

test('vide : titre, phrase, et retour', async () => {
  await renderWithProviders(<ATraiterScreen {...props} />);
  expect(screen.getByRole('header', { name: 'À traiter' })).toBeOnTheScreen();
  expect(screen.getByText("Rien à traiter pour l'instant.")).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Retour' }));
  expect(goBack).toHaveBeenCalled();
});

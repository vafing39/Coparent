import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { TextField } from '../TextField';

test('champ normal : pas de bouton « œil »', async () => {
  await render(<TextField label="Prénom" value="" onChangeText={jest.fn()} />);
  expect(
    screen.queryByRole('button', { name: 'Afficher le mot de passe' }),
  ).toBeNull();
});

test('mot de passe : masqué par défaut, le bouton l’affiche puis le masque', async () => {
  await render(
    <TextField
      label="Mot de passe"
      value="secret"
      onChangeText={jest.fn()}
      secureTextEntry
    />,
  );
  const input = screen.getByLabelText('Mot de passe');
  expect(input).toHaveProp('secureTextEntry', true);

  await fireEvent.press(
    screen.getByRole('button', { name: 'Afficher le mot de passe' }),
  );
  expect(input).toHaveProp('secureTextEntry', false);

  await fireEvent.press(
    screen.getByRole('button', { name: 'Masquer le mot de passe' }),
  );
  expect(input).toHaveProp('secureTextEntry', true);
});

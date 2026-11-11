import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import App from '../App';

test("l'app démarre sur l'écran Bienvenue", async () => {
  await render(<App />);
  expect(
    await screen.findByRole('button', { name: 'Créer mon compte' }),
  ).toBeOnTheScreen();
});

test('« Accéder à mon espace » mène à l’écran de connexion', async () => {
  await render(<App />);
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Accéder à mon espace' }),
  );
  expect(
    await screen.findByRole('header', { name: 'Accéder à mon espace' }),
  ).toBeOnTheScreen();
  expect(
    screen.getByRole('button', { name: 'Se connecter' }),
  ).toBeOnTheScreen();
});

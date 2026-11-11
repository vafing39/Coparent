import React from 'react';
import { render, screen } from '@testing-library/react-native';
import App from '../App';

test("l'app démarre sur l'écran Bienvenue", async () => {
  await render(<App />);
  expect(
    await screen.findByRole('button', { name: 'Créer mon compte' }),
  ).toBeOnTheScreen();
});

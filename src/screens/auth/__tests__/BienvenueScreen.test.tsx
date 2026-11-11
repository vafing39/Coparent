import React from 'react';
import { Linking } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { BienvenueScreen } from '../BienvenueScreen';
import { APP_NAME, PRIVACY_URL, TERMS_URL } from '../../../lib/app';

const navigate = jest.fn();

function renderScreen() {
  const props = {
    navigation: { navigate },
    route: { key: 'Bienvenue', name: 'Bienvenue' },
  } as unknown as React.ComponentProps<typeof BienvenueScreen>;
  return render(<BienvenueScreen {...props} />);
}

beforeEach(() => {
  navigate.mockClear();
});

test('affiche le nom, le titre et le texte de présentation', async () => {
  await renderScreen();
  expect(screen.getByText(APP_NAME)).toBeOnTheScreen();
  expect(
    screen.getByRole('header', {
      name: 'Organisez la garde, échangez sereinement.',
    }),
  ).toBeOnTheScreen();
  expect(screen.getByText(/Neutre pour les deux parents/)).toBeOnTheScreen();
});

test('« Créer mon compte » ouvre l’inscription', async () => {
  await renderScreen();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Créer mon compte' }),
  );
  expect(navigate).toHaveBeenCalledWith('Inscription');
});

test('« Accéder à mon espace » ouvre la connexion', async () => {
  await renderScreen();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Accéder à mon espace' }),
  );
  expect(navigate).toHaveBeenCalledWith('ConnexionEmail');
});

test('les liens légaux ouvrent leur page', async () => {
  const openURL = jest
    .spyOn(Linking, 'openURL')
    .mockResolvedValue(undefined as never);
  await renderScreen();
  await fireEvent.press(
    screen.getByRole('link', { name: "conditions d'utilisation" }),
  );
  await fireEvent.press(
    screen.getByRole('link', { name: 'politique de confidentialité' }),
  );
  expect(openURL).toHaveBeenNthCalledWith(1, TERMS_URL);
  expect(openURL).toHaveBeenNthCalledWith(2, PRIVACY_URL);
  openURL.mockRestore();
});

test('le logo décoratif est masqué aux lecteurs d’écran', async () => {
  await renderScreen();
  // Seuls le nom, le titre, la présentation et le texte légal sont lus.
  expect(screen.queryAllByRole('image')).toHaveLength(0);
});

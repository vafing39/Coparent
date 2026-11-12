import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { MotDePasseScreen } from '../MotDePasseScreen';
import { ApiError } from '../../../api/errors';
import { authApi } from '../../../test-utils/fakeApiClient';
import { renderWithProviders } from '../../../test-utils/render';

jest.mock('../../../api/client', () =>
  jest.requireActual('../../../test-utils/fakeApiClient'),
);

const popTo = jest.fn();
const PASSWORD = 'un mot de passe solide';

function props(email?: string) {
  return {
    navigation: { popTo },
    route: {
      key: 'MotDePasse',
      name: 'MotDePasse',
      params: email ? { email } : undefined,
    },
  } as unknown as React.ComponentProps<typeof MotDePasseScreen>;
}

async function renderScreen(email?: string) {
  await renderWithProviders(<MotDePasseScreen {...props(email)} />);
}

async function press(name: string) {
  await fireEvent.press(screen.getByRole('button', { name }));
}

async function goToCodeStep(email = 'lea@exemple.fr') {
  await renderScreen(email);
  await press('Envoyer le code');
  await screen.findByLabelText('Code reçu par email');
}

async function fillCodeStep(code: string, password = PASSWORD) {
  await fireEvent.changeText(
    screen.getByLabelText('Code reçu par email'),
    code,
  );
  await fireEvent.changeText(
    screen.getByLabelText('Nouveau mot de passe'),
    password,
  );
  await fireEvent.changeText(
    screen.getByLabelText('Confirmer le mot de passe'),
    password,
  );
}

beforeEach(() => {
  popTo.mockClear();
  authApi.forgotPassword.mockReset().mockResolvedValue(undefined);
  authApi.resetPassword.mockReset().mockResolvedValue(undefined);
});

test('reprend l’adresse saisie sur l’écran de connexion', async () => {
  await renderScreen('lea@exemple.fr');
  expect(
    screen.getByRole('header', { name: 'Mot de passe oublié' }),
  ).toBeOnTheScreen();
  expect(screen.getByLabelText('Adresse email')).toHaveDisplayValue(
    'lea@exemple.fr',
  );
});

test('adresse invalide : message, aucun envoi', async () => {
  await renderScreen();
  await fireEvent.changeText(screen.getByLabelText('Adresse email'), 'lea');
  await press('Envoyer le code');
  expect(
    await screen.findByText(
      'Adresse email invalide, par exemple vous@exemple.fr.',
    ),
  ).toBeOnTheScreen();
  expect(authApi.forgotPassword).not.toHaveBeenCalled();
});

test('envoie le code puis affiche un message neutre', async () => {
  await goToCodeStep();
  expect(authApi.forgotPassword).toHaveBeenCalledWith('lea@exemple.fr');
  expect(
    screen.getByText(/vous recevrez un code valable 30 minutes/),
  ).toBeOnTheScreen();
});

test('envoi refusé (trop de tentatives) : reste sur l’adresse', async () => {
  authApi.forgotPassword.mockRejectedValue(new ApiError(429));
  await renderScreen('lea@exemple.fr');
  await press('Envoyer le code');
  expect(
    await screen.findByText(
      'Trop de tentatives. Réessayez dans quelques minutes.',
    ),
  ).toBeOnTheScreen();
  expect(screen.queryByLabelText('Code reçu par email')).toBeNull();
});

test('code incomplet et mots de passe différents : aucun appel', async () => {
  await goToCodeStep();
  await fireEvent.changeText(
    screen.getByLabelText('Code reçu par email'),
    '1234',
  );
  await fireEvent.changeText(
    screen.getByLabelText('Nouveau mot de passe'),
    PASSWORD,
  );
  await fireEvent.changeText(
    screen.getByLabelText('Confirmer le mot de passe'),
    'autre chose encore',
  );
  await press('Enregistrer');
  expect(
    await screen.findByText('Le code contient 8 chiffres.'),
  ).toBeOnTheScreen();
  expect(
    screen.getByText('Les mots de passe ne correspondent pas.'),
  ).toBeOnTheScreen();
  expect(authApi.resetPassword).not.toHaveBeenCalled();
});

test('enregistre le mot de passe puis revient à la connexion avec l’adresse', async () => {
  await goToCodeStep();
  await fillCodeStep('4829 1375');
  await press('Enregistrer');
  expect(
    await screen.findByText(
      'Mot de passe modifié. Connectez-vous avec votre nouveau mot de passe.',
    ),
  ).toBeOnTheScreen();
  expect(authApi.resetPassword).toHaveBeenCalledWith({
    email: 'lea@exemple.fr',
    code: '48291375',
    newPassword: PASSWORD,
    confirmPassword: PASSWORD,
  });
  await press('Se connecter');
  expect(popTo).toHaveBeenCalledWith('ConnexionEmail', {
    email: 'lea@exemple.fr',
  });
});

test('code incorrect : message sous le code', async () => {
  authApi.resetPassword.mockRejectedValue(
    new ApiError(400, 'Code incorrect ou expiré.'),
  );
  await goToCodeStep();
  await fillCodeStep('12345678');
  await press('Enregistrer');
  expect(
    await screen.findByText(
      'Code incorrect ou expiré. Vérifiez-le ou demandez un nouveau code.',
    ),
  ).toBeOnTheScreen();
});

test('mot de passe refusé par le serveur : message du serveur', async () => {
  authApi.resetPassword.mockRejectedValue(
    new ApiError(400, 'Ce mot de passe est trop courant.'),
  );
  await goToCodeStep();
  await fillCodeStep('12345678');
  await press('Enregistrer');
  expect(
    await screen.findByText('Ce mot de passe est trop courant.'),
  ).toBeOnTheScreen();
});

test('renvoie le code', async () => {
  await goToCodeStep();
  await press('Renvoyer le code');
  expect(
    await screen.findByText('Un nouveau code vient d’être envoyé.'),
  ).toBeOnTheScreen();
  expect(authApi.forgotPassword).toHaveBeenCalledTimes(2);
});

test('modifier l’adresse : retour à la première étape', async () => {
  await goToCodeStep();
  await press("Modifier l'adresse");
  expect(screen.getByLabelText('Adresse email')).toHaveDisplayValue(
    'lea@exemple.fr',
  );
  expect(screen.queryByLabelText('Code reçu par email')).toBeNull();
});

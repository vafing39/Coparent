import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { ChangePasswordScreen } from '../ChangePasswordScreen';
import { DataExportScreen } from '../DataExportScreen';
import { DeleteAccountScreen } from '../DeleteAccountScreen';
import { ApiError } from '../../../api/errors';
import { AccountProvider } from '../../../context/AccountContext';
import { loadRefreshToken } from '../../../lib/tokenStorage';
import { useSession } from '../../../stores/session';
import { authResponse } from '../../../test-utils/authFixtures';
import { accountApi } from '../../../test-utils/fakeApiClient';
import { renderWithProviders } from '../../../test-utils/render';

jest.mock('../../../api/client', () =>
  jest.requireActual('../../../test-utils/fakeApiClient'),
);

const goBack = jest.fn();
function props<T>(name: string): T {
  return {
    navigation: { goBack },
    route: { key: name, name },
  } as unknown as T;
}

const OLD = 'correct-horse-battery';
const NEW = 'another-long-passphrase';

beforeEach(async () => {
  goBack.mockReset();
  accountApi.changePassword.mockReset();
  accountApi.requestDataExport.mockReset();
  accountApi.deleteAccount.mockReset();
  await useSession.getState().signIn(authResponse());
});

describe('Modifier le mot de passe', () => {
  async function renderScreen() {
    await renderWithProviders(
      <AccountProvider>
        <ChangePasswordScreen
          {...props<React.ComponentProps<typeof ChangePasswordScreen>>(
            'ModifierMotDePasse',
          )}
        />
      </AccountProvider>,
    );
  }

  async function fill(current: string, next: string, confirm: string) {
    await fireEvent.changeText(
      screen.getByLabelText('Mot de passe actuel'),
      current,
    );
    await fireEvent.changeText(
      screen.getByLabelText('Nouveau mot de passe'),
      next,
    );
    await fireEvent.changeText(
      screen.getByLabelText('Confirmer le mot de passe'),
      confirm,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Enregistrer' }));
  }

  test('nouveau mot de passe enregistré : nouvelle session sur ce téléphone', async () => {
    accountApi.changePassword.mockResolvedValue(authResponse('2'));
    await renderScreen();
    await fill(OLD, NEW, NEW);
    expect(
      await screen.findByText(
        'Votre mot de passe a été modifié. Vos autres appareils ont été déconnectés.',
      ),
    ).toBeOnTheScreen();
    expect(accountApi.changePassword).toHaveBeenCalledWith({
      currentPassword: OLD,
      newPassword: NEW,
      confirmPassword: NEW,
    });
    expect(useSession.getState().accessToken).toBe('access-2');
    expect(await loadRefreshToken()).toBe('refresh-2');
    await fireEvent.press(
      screen.getByRole('button', { name: 'Retour au compte' }),
    );
    expect(goBack).toHaveBeenCalled();
  });

  test('mot de passe actuel incorrect : erreur sur le champ', async () => {
    accountApi.changePassword.mockRejectedValue(new ApiError(403));
    await renderScreen();
    await fill('wrong-password-123', NEW, NEW);
    expect(
      await screen.findByText('Mot de passe actuel incorrect.'),
    ).toBeOnTheScreen();
    expect(useSession.getState().accessToken).toBe('access-1');
  });

  test('vérifié avant envoi : longueur et confirmation', async () => {
    await renderScreen();
    await fill('', 'court', 'autre');
    expect(
      await screen.findByText('Saisissez votre mot de passe actuel.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('12 caractères minimum.')).toBeOnTheScreen();
    expect(
      screen.getByText('Les mots de passe ne correspondent pas.'),
    ).toBeOnTheScreen();
    expect(accountApi.changePassword).not.toHaveBeenCalled();
  });
});

describe('Télécharger mes données', () => {
  async function renderScreen() {
    await renderWithProviders(
      <AccountProvider>
        <DataExportScreen
          {...props<React.ComponentProps<typeof DataExportScreen>>(
            'MesDonnees',
          )}
        />
      </AccountProvider>,
    );
  }

  test('envoi par email à l’adresse du compte', async () => {
    accountApi.requestDataExport.mockResolvedValue(undefined);
    await renderScreen();
    expect(
      screen.getByText('• les discussions et leurs messages'),
    ).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Recevoir mes données par email' }),
    );
    expect(await screen.findByText(/camille@exemple\.fr/)).toBeOnTheScreen();
    expect(
      screen.queryByRole('button', { name: 'Recevoir mes données par email' }),
    ).toBeNull();
  });

  test('trois demandes par jour au plus', async () => {
    accountApi.requestDataExport.mockRejectedValue(new ApiError(429));
    await renderScreen();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Recevoir mes données par email' }),
    );
    expect(
      await screen.findByText(
        "Vous avez déjà demandé vos données trois fois aujourd'hui. Réessayez demain.",
      ),
    ).toBeOnTheScreen();
  });
});

describe('Supprimer mon compte', () => {
  async function renderScreen() {
    await renderWithProviders(
      <AccountProvider>
        <DeleteAccountScreen
          {...props<React.ComponentProps<typeof DeleteAccountScreen>>(
            'SupprimerCompte',
          )}
        />
      </AccountProvider>,
    );
  }

  async function confirmWith(password: string) {
    const alert = jest.spyOn(Alert, 'alert');
    await fireEvent.changeText(screen.getByLabelText('Mot de passe'), password);
    await fireEvent.press(
      screen.getByRole('button', { name: 'Supprimer mon compte' }),
    );
    await waitFor(() => expect(alert).toHaveBeenCalled());
    expect(alert.mock.calls[0][0]).toBe('Supprimer votre compte ?');
    const ok = (alert.mock.calls[0][2] ?? []).find(b => b.text === 'Supprimer');
    expect(ok?.style).toBe('destructive');
    await ok?.onPress?.();
    alert.mockRestore();
  }

  test('ce qui se passe, puis suppression et déconnexion', async () => {
    accountApi.deleteAccount.mockResolvedValue(undefined);
    await renderScreen();
    expect(
      screen.getByText(
        '• vos données personnelles sont supprimées sous 30 jours ;',
      ),
    ).toBeOnTheScreen();
    expect(
      screen.getByText(
        "• les messages déjà envoyés restent visibles par l'autre parent ;",
      ),
    ).toBeOnTheScreen();
    expect(
      screen.getByText(
        "Si vous avez un abonnement, pensez à l'annuler aussi dans l'App Store ou Google Play.",
      ),
    ).toBeOnTheScreen();

    await confirmWith(OLD);
    await waitFor(() => expect(useSession.getState().status).toBe('signedOut'));
    expect(accountApi.deleteAccount).toHaveBeenCalledWith(OLD);
    expect(useSession.getState().authEntry).toBe('Bienvenue');
  });

  test('mot de passe incorrect : erreur sur le champ, la session reste ouverte', async () => {
    accountApi.deleteAccount.mockRejectedValue(new ApiError(403));
    await renderScreen();
    await confirmWith('wrong-password-123');
    expect(
      await screen.findByText('Mot de passe incorrect.'),
    ).toBeOnTheScreen();
    expect(useSession.getState().status).toBe('signedIn');
  });

  test('sans mot de passe : rien n’est envoyé', async () => {
    const alert = jest.spyOn(Alert, 'alert');
    await renderScreen();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Supprimer mon compte' }),
    );
    expect(
      await screen.findByText('Saisissez votre mot de passe.'),
    ).toBeOnTheScreen();
    expect(alert).not.toHaveBeenCalled();
    alert.mockRestore();
  });
});

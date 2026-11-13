import { Linking } from 'react-native';
import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import * as Keychain from 'react-native-keychain';
import { RootNavigator } from '../RootNavigator';
import { ApiError } from '../../api/errors';
import { saveRefreshToken } from '../../lib/tokenStorage';
import { useSession } from '../../stores/session';
import { authResponse } from '../../test-utils/authFixtures';
import {
  authApi,
  familyApi,
  invitationApi,
} from '../../test-utils/fakeApiClient';
import { family } from '../../test-utils/familyFixtures';
import {
  INVITATION_TOKEN,
  INVITATION_URL,
  invitationPreview,
} from '../../test-utils/invitationFixtures';
import { renderWithProviders } from '../../test-utils/render';

jest.mock('../../api/client', () =>
  jest.requireActual('../../test-utils/fakeApiClient'),
);

const PREVIEW_TITLE =
  'Camille vous invite à rejoindre la famille de Léa et Hugo';

/** Utilisateur invité (Julien), email vérifié. */
function julien(suffix = '1') {
  const auth = authResponse(suffix);
  return {
    ...auth,
    user: {
      ...auth.user,
      firstName: 'Julien',
      email: 'julien@exemple.fr',
      emailVerified: true,
    },
  };
}

/** Famille rejointe : prête (enfants et rythme), Julien en parent B. */
function joinedFamily() {
  const preview = invitationPreview();
  return family({
    myRole: 'PARENT_B',
    solo: false,
    children: [{ id: 'c1', firstName: 'Léa', birthDate: '2018-03-02' }],
    custodySchedule: preview.custodySchedule,
  });
}

async function renderApp() {
  await renderWithProviders(<RootNavigator />);
}

async function press(name: string) {
  await fireEvent.press(screen.getByRole('button', { name }));
}

/** Session enregistrée : au démarrage, la reprise reconnecte Julien. */
async function signedInAsJulien() {
  await saveRefreshToken('refresh-old');
  authApi.refresh.mockResolvedValue(julien('new'));
}

beforeEach(() => {
  (Keychain as unknown as { __reset: () => void }).__reset();
  jest.clearAllMocks();
  useSession.setState({
    status: 'restoring',
    user: null,
    accessToken: null,
    authEntry: 'Bienvenue',
  });
  jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(INVITATION_URL);
  invitationApi.preview.mockResolvedValue(invitationPreview());
  invitationApi.accept.mockResolvedValue(joinedFamily());
  familyApi.fetchMyFamily.mockResolvedValue(null);
  authApi.logout.mockResolvedValue();
});

describe('lien ouvert sans être connecté', () => {
  test('aperçu : qui invite, enfants, rythme proposé, validité', async () => {
    await renderApp();
    expect(
      await screen.findByRole('header', { name: PREVIEW_TITLE }),
    ).toBeOnTheScreen();
    expect(invitationApi.preview).toHaveBeenCalledWith(INVITATION_TOKEN);
    expect(screen.getByText('Déjà renseigné par Camille')).toBeOnTheScreen();
    expect(screen.getByText(/Léa \(8 ans\), Hugo \(5 ans\)/)).toBeOnTheScreen();
    expect(
      screen.getByText(/une semaine sur deux, bascule le vendredi à 17 h 50/),
    ).toBeOnTheScreen();
    expect(
      screen.getByText(/Invitation valable jusqu'au 17 novembre\./),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Créer mon compte et rejoindre' }),
    ).toBeOnTheScreen();
  });

  test('« Ignorer cette invitation » : retour à l’accueil, invitation oubliée', async () => {
    await renderApp();
    await screen.findByRole('header', { name: PREVIEW_TITLE });
    await press('Ignorer cette invitation');
    expect(
      await screen.findByRole('button', { name: 'Créer mon compte' }),
    ).toBeOnTheScreen();
  });

  test('lien plus valide : message, puis on continue sans invitation', async () => {
    invitationApi.preview.mockResolvedValue(null);
    await renderApp();
    expect(
      await screen.findByText(
        "Cette invitation n'est plus valide. Demandez un nouveau lien à l'autre parent.",
      ),
    ).toBeOnTheScreen();
    await press('Continuer sans invitation');
    expect(
      await screen.findByRole('button', { name: 'Créer mon compte' }),
    ).toBeOnTheScreen();
  });

  test('erreur réseau : « Réessayer » recharge l’aperçu', async () => {
    invitationApi.preview
      .mockRejectedValueOnce(new ApiError(null))
      .mockResolvedValue(invitationPreview());
    await renderApp();
    expect(
      await screen.findByText(
        "L'invitation n'a pas pu être chargée. Vérifiez votre accès à Internet, puis réessayez.",
      ),
    ).toBeOnTheScreen();
    await press('Réessayer');
    expect(
      await screen.findByRole('header', { name: PREVIEW_TITLE }),
    ).toBeOnTheScreen();
  });

  test('« J’ai déjà un compte » puis connexion : la famille est rejointe, l’app s’ouvre', async () => {
    authApi.login.mockResolvedValue(julien());
    await renderApp();
    await screen.findByRole('header', { name: PREVIEW_TITLE });
    await press("J'ai déjà un compte");

    await fireEvent.changeText(
      await screen.findByLabelText('Adresse email'),
      'julien@exemple.fr',
    );
    await fireEvent.changeText(
      screen.getByLabelText('Mot de passe'),
      'un-mot-de-passe-solide',
    );
    await press('Se connecter');

    expect(
      await screen.findByRole('button', { name: 'Compte et famille' }),
    ).toBeOnTheScreen();
    expect(invitationApi.accept).toHaveBeenCalledWith(INVITATION_TOKEN);
  });
});

describe('lien ouvert en étant connecté', () => {
  test('sans famille : aperçu, « Rejoindre la famille », puis l’app', async () => {
    await signedInAsJulien();
    await renderApp();
    await screen.findByRole('header', { name: PREVIEW_TITLE });
    expect(invitationApi.accept).not.toHaveBeenCalled();

    await press('Rejoindre la famille');
    expect(
      await screen.findByRole('button', { name: 'Compte et famille' }),
    ).toBeOnTheScreen();
    expect(invitationApi.accept).toHaveBeenCalledTimes(1);
  });

  test('refus du serveur (409) : la cause, puis la première connexion', async () => {
    invitationApi.accept.mockRejectedValue(
      new ApiError(409, 'La famille compte déjà deux parents.'),
    );
    await signedInAsJulien();
    await renderApp();
    await screen.findByRole('header', { name: PREVIEW_TITLE });
    await press('Rejoindre la famille');

    expect(
      await screen.findByText('La famille compte déjà deux parents.'),
    ).toBeOnTheScreen();
    await press('Continuer');
    expect(
      await screen.findByRole('header', { name: 'Créez votre famille' }),
    ).toBeOnTheScreen();
  });

  test('déjà dans une famille : invitation impossible, sans appel au serveur', async () => {
    familyApi.fetchMyFamily.mockResolvedValue(joinedFamily());
    await signedInAsJulien();
    await renderApp();
    expect(
      await screen.findByText(
        "Vous faites déjà partie d'une famille : cette invitation ne peut pas être acceptée.",
      ),
    ).toBeOnTheScreen();
    expect(invitationApi.accept).not.toHaveBeenCalled();

    await press('Continuer');
    expect(
      await screen.findByRole('button', { name: 'Compte et famille' }),
    ).toBeOnTheScreen();
  });
});

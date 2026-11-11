import React from 'react';
import { Share } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { InvitationScreen } from '../InvitationScreen';
import { ApiError } from '../../../api/errors';
import type { OnboardingStackParamList } from '../../../navigation/types';
import { useSession } from '../../../stores/session';
import { authResponse } from '../../../test-utils/authFixtures';
import { familyApi } from '../../../test-utils/fakeApiClient';
import { family } from '../../../test-utils/familyFixtures';
import { renderWithProviders } from '../../../test-utils/render';

jest.mock('../../../api/client', () =>
  jest.requireActual('../../../test-utils/fakeApiClient'),
);

const mockedFetch = familyApi.fetchMyFamily;
const mockedInvite = familyApi.createInvitation;
const mockedSetString = Clipboard.setString as jest.Mock;
const shareSpy = jest.spyOn(Share, 'share');
const finish = jest.fn();

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

const LINK = 'https://coparent.app/invitation?token=abc';

async function renderScreen() {
  await renderWithProviders(
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Invitation" component={InvitationScreen} />
      </Stack.Navigator>
    </NavigationContainer>,
    { onboarding: true, onFinishOnboarding: finish },
  );
  await screen.findByRole('header', { name: "Invitez l'autre parent" });
}

async function typeFirstName(value: string) {
  await fireEvent.changeText(
    screen.getByLabelText("Prénom de l'autre parent"),
    value,
  );
}

async function press(name: string) {
  await fireEvent.press(screen.getByRole('button', { name }));
}

beforeEach(async () => {
  finish.mockReset();
  mockedSetString.mockClear();
  shareSpy
    .mockReset()
    .mockResolvedValue({ action: Share.sharedAction, activityType: undefined });
  mockedFetch.mockReset().mockResolvedValue(family());
  mockedInvite
    .mockReset()
    .mockResolvedValue({ link: LINK, expiresAt: '2026-11-18T10:00:00Z' });
  await useSession.getState().signIn(authResponse());
});

test('étape 5 sur 5 : prénom, partage, copie et étape facultative', async () => {
  await renderScreen();
  expect(screen.getByRole('progressbar')).toHaveAccessibilityValue({
    now: 5,
    max: 5,
  });
  expect(screen.getByLabelText("Prénom de l'autre parent")).toBeOnTheScreen();
  expect(
    screen.getByRole('button', { name: "Partager le lien d'invitation" }),
  ).toBeOnTheScreen();
  expect(
    screen.getByRole('button', { name: 'Copier le lien' }),
  ).toBeOnTheScreen();
  expect(screen.getByText('Le lien est valable 7 jours.')).toBeOnTheScreen();
});

test('« Passer cette étape » termine la première connexion sans lien', async () => {
  await renderScreen();
  await press('Passer cette étape');
  expect(finish).toHaveBeenCalledTimes(1);
  expect(mockedInvite).not.toHaveBeenCalled();
});

test('prénom manquant : message, aucun lien créé', async () => {
  await renderScreen();
  await press("Partager le lien d'invitation");
  expect(
    await screen.findByText("Indiquez le prénom de l'autre parent."),
  ).toBeOnTheScreen();
  expect(mockedInvite).not.toHaveBeenCalled();
});

test('partage : crée le lien pour ce prénom, ouvre le partage, puis « Terminer »', async () => {
  await renderScreen();
  await typeFirstName('  Julien ');
  await press("Partager le lien d'invitation");
  await waitFor(() => expect(shareSpy).toHaveBeenCalledTimes(1));
  expect(mockedInvite).toHaveBeenCalledWith(family().id, 'Julien');
  expect(shareSpy.mock.calls[0][0]).toEqual({
    message: expect.stringContaining(LINK),
  });

  await press('Terminer');
  expect(finish).toHaveBeenCalledTimes(1);
});

test('copie : lien dans le presse-papiers, sans nouveau lien pour le même prénom', async () => {
  await renderScreen();
  await typeFirstName('Julien');
  await press('Copier le lien');
  expect(
    await screen.findByRole('button', { name: 'Lien copié' }),
  ).toBeOnTheScreen();
  expect(mockedSetString).toHaveBeenCalledWith(LINK);

  await press("Partager le lien d'invitation");
  await waitFor(() => expect(shareSpy).toHaveBeenCalledTimes(1));
  expect(mockedInvite).toHaveBeenCalledTimes(1);
});

test('autre prénom : un nouveau lien est créé', async () => {
  await renderScreen();
  await typeFirstName('Julien');
  await press('Copier le lien');
  await screen.findByRole('button', { name: 'Lien copié' });

  await typeFirstName('Jules');
  expect(
    screen.getByRole('button', { name: 'Copier le lien' }),
  ).toBeOnTheScreen();
  await press('Copier le lien');
  await waitFor(() => expect(mockedInvite).toHaveBeenCalledTimes(2));
  expect(mockedInvite.mock.calls[1][1]).toBe('Jules');
});

test('famille déjà complète : message, pas de partage', async () => {
  mockedInvite.mockRejectedValue(new ApiError(409));
  await renderScreen();
  await typeFirstName('Julien');
  await press("Partager le lien d'invitation");
  expect(
    await screen.findByText('La famille compte déjà deux parents.'),
  ).toBeOnTheScreen();
  expect(shareSpy).not.toHaveBeenCalled();
  expect(
    screen.getByRole('button', { name: 'Passer cette étape' }),
  ).toBeOnTheScreen();
});

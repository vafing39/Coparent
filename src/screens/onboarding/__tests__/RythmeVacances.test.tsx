import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { fireEvent, screen } from '@testing-library/react-native';
import { RythmeScreen } from '../RythmeScreen';
import { VacancesScreen } from '../VacancesScreen';
import { ApiError } from '../../../api/errors';
import type { CustodySchedule } from '../../../api/types';
import { nextWeekday, todayInParis } from '../../../lib/dates';
import type { OnboardingStackParamList } from '../../../navigation/types';
import { family } from '../../../test-utils/familyFixtures';
import { familyApi } from '../../../test-utils/fakeApiClient';
import { renderWithProviders } from '../../../test-utils/render';

jest.mock('../../../api/client', () =>
  jest.requireActual('../../../test-utils/fakeApiClient'),
);

const mockedFetch = familyApi.fetchMyFamily;
const mockedPropose = familyApi.proposeSchedule;

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

function InvitationStub() {
  return <Text>Étape 5</Text>;
}

/** Étapes 4 (rythme), sous-réglage vacances, puis un écran factice pour l'étape 5. */
async function renderFlow() {
  await renderWithProviders(
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Rythme" component={RythmeScreen} />
        <Stack.Screen name="Vacances" component={VacancesScreen} />
        <Stack.Screen name="Invitation" component={InvitationStub} />
      </Stack.Navigator>
    </NavigationContainer>,
    { onboarding: true },
  );
  await screen.findByRole('header', { name: 'Choisissez le rythme de garde' });
}

async function press(name: string) {
  await fireEvent.press(screen.getByRole('button', { name }));
}

async function goToHolidays() {
  await press('Continuer');
  await screen.findByRole('header', { name: 'Vacances scolaires' });
}

beforeEach(() => {
  mockedFetch.mockReset().mockResolvedValue(family());
  mockedPropose.mockReset().mockImplementation(
    async (_id, body) =>
      ({
        id: 's1',
        customSequence: null,
        status: 'PROPOSED',
        proposedById: 'u1',
        proposedByFirstName: 'Camille',
        ...body,
      } as CustodySchedule),
  );
});

test('étape 4 sur 5 : cinq rythmes, « Une semaine sur deux » par défaut', async () => {
  await renderFlow();
  expect(screen.getByRole('progressbar')).toHaveAccessibilityValue({
    now: 4,
    max: 5,
  });
  expect(
    screen.getByRole('radio', { name: 'Une semaine sur deux' }),
  ).toBeChecked();
  expect(
    screen.getAllByRole('radio', {
      name: /2-2|Week-ends|Personnalisé|semaine/,
    }),
  ).toHaveLength(5);
  expect(
    screen.getByText(
      "Sur deux semaines : 7 nuits chez Camille, 7 nuits chez l'autre parent.",
    ),
  ).toBeOnTheScreen();
});

test('changer de rythme met à jour l’aperçu', async () => {
  await renderFlow();
  await fireEvent.press(screen.getByRole('radio', { name: '2-2-5-5' }));
  expect(
    screen.getByText(
      "Sur deux semaines : 7 nuits chez Camille, 7 nuits chez l'autre parent.",
    ),
  ).toBeOnTheScreen();
  await fireEvent.press(
    screen.getByRole('radio', {
      name: "Chez l'autre parent",
    }),
  );
  expect(
    screen.getByRole('radio', { name: "Chez l'autre parent" }),
  ).toBeChecked();
});

test('personnalisé : chaque nuit se touche pour changer de parent', async () => {
  await renderFlow();
  await fireEvent.press(screen.getByRole('radio', { name: 'Personnalisé' }));
  // Le choix du parent de départ disparaît : c'est la première nuit qui le donne.
  expect(screen.queryByRole('radio', { name: 'Chez vous' })).toBeNull();
  await press('Nuit du vendredi, semaine 1 : chez Camille.');
  expect(
    screen.getByRole('button', {
      name: "Nuit du vendredi, semaine 1 : chez l'autre parent.",
    }),
  ).toBeOnTheScreen();
  expect(
    screen.getByText(
      "Sur deux semaines : 6 nuits chez Camille, 8 nuits chez l'autre parent.",
    ),
  ).toBeOnTheScreen();
});

test('heure : choisie dans le sélecteur, confirmée par OK', async () => {
  await renderFlow();
  await press('Heure de bascule : 17 h 50');
  const picker = screen.getByTestId('time-picker');
  await fireEvent(
    picker,
    'change',
    { type: 'set' },
    new Date(2000, 0, 1, 18, 30),
  );
  await press('OK');
  expect(
    screen.getByRole('button', { name: 'Heure de bascule : 18 h 30' }),
  ).toBeOnTheScreen();
});

test('rythme puis vacances : « Enregistrer » envoie tout, puis étape 5', async () => {
  await renderFlow();
  await fireEvent.press(screen.getByRole('radio', { name: '2-2-3' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'lundi' }));
  await goToHolidays();
  expect(screen.getByText(/^Zone A\./)).toBeOnTheScreen();

  await fireEvent.press(
    screen.getByRole('radio', {
      name: 'Vous avez la 1re moitié les années impaires',
    }),
  );
  await fireEvent.press(screen.getByRole('radio', { name: 'Par mois' }));
  await press('Enregistrer');

  expect(await screen.findByText('Étape 5')).toBeOnTheScreen();
  expect(mockedPropose).toHaveBeenCalledWith(family().id, {
    pattern: 'TWO_TWO_THREE',
    startDate: nextWeekday(todayInParis(), 1),
    handoverTime: '17:50',
    startingParent: 'PARENT_A',
    holidayFirstHalfEvenYears: 'PARENT_B',
    summerSplit: 'MONTHS',
  });
});

test('personnalisé : la séquence des nuits est envoyée', async () => {
  await renderFlow();
  await fireEvent.press(screen.getByRole('radio', { name: 'Personnalisé' }));
  await press("Nuit du samedi, semaine 2 : chez l'autre parent.");
  await goToHolidays();
  await press('Enregistrer');
  await screen.findByText('Étape 5');
  expect(mockedPropose.mock.calls[0][1]).toMatchObject({
    pattern: 'CUSTOM',
    customSequence: 'AAAAAAABABBBBB',
  });
});

test('échec de l’enregistrement : message, pas d’étape 5', async () => {
  mockedPropose.mockRejectedValue(new ApiError(400));
  await renderFlow();
  await goToHolidays();
  await press('Enregistrer');
  expect(
    await screen.findByText(/Le rythme n'a pas pu être enregistré/),
  ).toBeOnTheScreen();
  expect(screen.queryByText('Étape 5')).toBeNull();
});

test('rythme déjà proposé : écrans préremplis', async () => {
  mockedFetch.mockResolvedValue(
    family({
      custodySchedule: {
        id: 's1',
        pattern: 'TWO_TWO_FIVE_FIVE',
        customSequence: null,
        startDate: '2026-11-17',
        handoverTime: '08:30:00',
        startingParent: 'PARENT_B',
        holidayFirstHalfEvenYears: 'PARENT_B',
        summerSplit: 'MONTHS',
        status: 'PROPOSED',
        proposedById: 'u1',
        proposedByFirstName: 'Camille',
      },
    }),
  );
  await renderFlow();
  expect(screen.getByRole('radio', { name: '2-2-5-5' })).toBeChecked();
  expect(screen.getByRole('radio', { name: 'mardi' })).toBeChecked();
  expect(
    screen.getByRole('button', { name: 'Heure de bascule : 8 h 30' }),
  ).toBeOnTheScreen();
  expect(
    screen.getByRole('radio', { name: "Chez l'autre parent" }),
  ).toBeChecked();
  await goToHolidays();
  expect(
    screen.getByRole('radio', {
      name: 'Vous avez la 1re moitié les années impaires',
    }),
  ).toBeChecked();
  expect(screen.getByRole('radio', { name: 'Par mois' })).toBeChecked();
});

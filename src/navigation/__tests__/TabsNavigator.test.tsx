import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, screen } from '@testing-library/react-native';
import { AppNavigator } from '../AppNavigator';
import { TabsNavigator } from '../TabsNavigator';
import { BagProvider } from '../../context/BagContext';
import { CalendarProvider } from '../../context/CalendarContext';
import { CustodyProvider } from '../../context/CustodyContext';
import { ExpensesProvider } from '../../context/ExpensesContext';
import { FamilyProvider } from '../../context/FamilyContext';
import { MessagesProvider } from '../../context/MessagesContext';
import { ToDoProvider } from '../../context/ToDoContext';
import { useSession } from '../../stores/session';
import { authResponse } from '../../test-utils/authFixtures';
import { familyApi } from '../../test-utils/fakeApiClient';
import { family } from '../../test-utils/familyFixtures';
import { renderWithProviders } from '../../test-utils/render';

jest.mock('../../api/client', () =>
  jest.requireActual('../../test-utils/fakeApiClient'),
);

const TABS = ['Accueil', 'Calendrier', 'Messages', 'Famille', 'Dépenses'];

async function renderTabs() {
  await renderWithProviders(
    <FamilyProvider>
      <CustodyProvider>
        <CalendarProvider>
          <BagProvider>
            <ToDoProvider>
              <MessagesProvider>
                <ExpensesProvider>
                  <NavigationContainer>
                    <TabsNavigator />
                  </NavigationContainer>
                </ExpensesProvider>
              </MessagesProvider>
            </ToDoProvider>
          </BagProvider>
        </CalendarProvider>
      </CustodyProvider>
    </FamilyProvider>,
  );
}

beforeEach(async () => {
  familyApi.fetchMyFamily.mockResolvedValue(
    family({
      children: [{ id: 'c1', firstName: 'Léa', birthDate: '2018-03-03' }],
    }),
  );
  familyApi.custody.mockResolvedValue({
    scheduleStatus: 'PROPOSED',
    nights: [],
    handovers: [],
    nextHandover: null,
  });
  await useSession.getState().signIn(authResponse());
});

test('affiche les 5 onglets, Accueil sélectionné', async () => {
  await renderTabs();
  await screen.findByRole('button', { name: 'Compte et famille' });
  for (const name of TABS) {
    expect(screen.getByRole('button', { name })).toBeOnTheScreen();
  }
  expect(screen.getByRole('button', { name: 'Accueil' })).toBeSelected();
});

test('l’onglet Calendrier ouvre le calendrier de garde', async () => {
  await renderTabs();
  await screen.findByRole('button', { name: 'Compte et famille' });
  await fireEvent.press(screen.getByRole('button', { name: 'Calendrier' }));
  expect(
    await screen.findByRole('header', { name: 'Calendrier' }),
  ).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Mois' })).toBeSelected();
  expect(screen.getByRole('button', { name: 'Calendrier' })).toBeSelected();
});

test.each([
  // Famille en mode solo : la messagerie attend l'autre parent.
  [
    'Messages',
    'Vos échanges seront conservés, datés et impossibles à modifier, pour vous deux.',
  ],
  [
    'Famille',
    'Bientôt, retrouvez ici les membres de la famille et les informations des enfants.',
  ],
  ['Dépenses', "Aucune dépense pour l'instant"],
])('l’onglet %s ouvre son écran', async (name, text) => {
  await renderTabs();
  await screen.findByRole('button', { name: 'Compte et famille' });
  await fireEvent.press(screen.getByRole('button', { name }));
  expect(await screen.findByRole('header', { name })).toBeOnTheScreen();
  expect(screen.getByText(text)).toBeOnTheScreen();
  expect(screen.getByRole('button', { name })).toBeSelected();
});

test('Messages : la liste des discussions garde la barre d’onglets', async () => {
  familyApi.fetchMyFamily.mockResolvedValue(
    family({
      solo: false,
      members: [
        {
          userId: '0c3b6a2e-0000-0000-0000-000000000001',
          firstName: 'Camille',
          role: 'PARENT_A',
        },
        { userId: 'u2', firstName: 'Julien', role: 'PARENT_B' },
      ],
      children: [{ id: 'c1', firstName: 'Léa', birthDate: '2018-03-03' }],
    }),
  );
  await renderTabs();
  await screen.findByRole('button', { name: 'Compte et famille' });
  await fireEvent.press(screen.getByRole('button', { name: 'Messages' }));
  expect(
    await screen.findByRole('button', { name: 'Nouvelle discussion' }),
  ).toBeOnTheScreen();
  for (const name of TABS) {
    expect(screen.getByRole('button', { name })).toBeOnTheScreen();
  }
  expect(screen.getByRole('button', { name: 'Messages' })).toBeSelected();
});

test('« Tout voir » ouvre « À traiter » par-dessus les onglets, puis retour', async () => {
  await renderWithProviders(
    <FamilyProvider>
      <CustodyProvider>
        <CalendarProvider>
          <BagProvider>
            <ToDoProvider>
              <MessagesProvider>
                <NavigationContainer>
                  <AppNavigator />
                </NavigationContainer>
              </MessagesProvider>
            </ToDoProvider>
          </BagProvider>
        </CalendarProvider>
      </CustodyProvider>
    </FamilyProvider>,
  );
  await fireEvent.press(await screen.findByRole('link', { name: 'Tout voir' }));
  expect(
    await screen.findByRole('header', { name: 'À traiter' }),
  ).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Retour' }));
  expect(
    await screen.findByRole('button', { name: 'Compte et famille' }),
  ).toBeOnTheScreen();
});

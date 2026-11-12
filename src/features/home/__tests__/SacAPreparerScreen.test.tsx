import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { SacAPreparerScreen } from '../SacAPreparerScreen';
import { ApiError } from '../../../api/errors';
import type { Bag, Family } from '../../../api/types';
import { BagProvider } from '../../../context/BagContext';
import { CustodyProvider } from '../../../context/CustodyContext';
import { FamilyProvider } from '../../../context/FamilyContext';
import { useSession } from '../../../stores/session';
import { authResponse } from '../../../test-utils/authFixtures';
import { bagApi, familyApi } from '../../../test-utils/fakeApiClient';
import { family } from '../../../test-utils/familyFixtures';
import { renderWithProviders } from '../../../test-utils/render';

jest.mock('../../../api/client', () =>
  jest.requireActual('../../../test-utils/fakeApiClient'),
);

const goBack = jest.fn();
const props = {
  navigation: { goBack },
  route: { key: 'SacAPreparer', name: 'SacAPreparer' },
} as unknown as React.ComponentProps<typeof SacAPreparerScreen>;

const TWO_PARENTS: Family = family({
  solo: false,
  members: [
    { userId: 'u1', firstName: 'Camille', role: 'PARENT_A' },
    { userId: 'u2', firstName: 'Julien', role: 'PARENT_B' },
  ],
  children: [
    { id: 'c1', firstName: 'Léa', birthDate: '2018-03-03' },
    { id: 'c2', firstName: 'Hugo', birthDate: '2020-05-12' },
  ],
});
const FAMILY_ID = TWO_PARENTS.id;

const EMPTY: Bag = {
  handoverAt: '2026-11-13T17:50:00',
  checkedCount: 0,
  total: 0,
  children: [
    { childId: 'c1', firstName: 'Léa', items: [] },
    { childId: 'c2', firstName: 'Hugo', items: [] },
  ],
};

const FILLED: Bag = {
  handoverAt: '2026-11-13T17:50:00',
  checkedCount: 1,
  total: 3,
  children: [
    {
      childId: 'c1',
      firstName: 'Léa',
      items: [
        {
          id: 'i1',
          label: 'Cahier de liaison',
          checked: true,
          checkedBy: 'Julien',
        },
      ],
    },
    {
      childId: 'c2',
      firstName: 'Hugo',
      items: [
        { id: 'i2', label: 'Kimono', checked: false, checkedBy: null },
        { id: 'i3', label: 'Doudou', checked: false, checkedBy: null },
      ],
    },
  ],
};

/** FILLED après avoir coché le kimono. */
const KIMONO_CHECKED: Bag = {
  ...FILLED,
  checkedCount: 2,
  children: [
    FILLED.children[0],
    {
      ...FILLED.children[1],
      items: [
        { id: 'i2', label: 'Kimono', checked: true, checkedBy: 'Camille' },
        FILLED.children[1].items[1],
      ],
    },
  ],
};

async function renderScreen() {
  await renderWithProviders(
    <FamilyProvider>
      <CustodyProvider>
        <BagProvider>
          <SacAPreparerScreen {...props} />
        </BagProvider>
      </CustodyProvider>
    </FamilyProvider>,
  );
}

beforeEach(async () => {
  jest.useFakeTimers({ now: new Date('2026-11-10T18:30:00Z') });
  goBack.mockReset();
  familyApi.fetchMyFamily.mockResolvedValue(TWO_PARENTS);
  familyApi.custody.mockResolvedValue({
    scheduleStatus: 'ACTIVE',
    nights: [],
    handovers: [],
    nextHandover: {
      at: '2026-11-13T17:50:00',
      from: 'PARENT_B',
      to: 'PARENT_A',
    },
  });
  bagApi.get.mockReset().mockResolvedValue(FILLED);
  bagApi.addItem.mockReset();
  bagApi.deleteItem.mockReset();
  bagApi.check.mockReset();
  bagApi.uncheck.mockReset();
  await useSession.getState().signIn(authResponse());
});

afterEach(() => {
  jest.useRealTimers();
});

test('contenu : passage, compte, enfants et cases, puis retour', async () => {
  await renderScreen();
  expect(await screen.findByText('1 sur 3 cochés')).toBeOnTheScreen();
  expect(
    screen.getByText('ven. 13 nov. · 17 h 50 · Julien vers Camille'),
  ).toBeOnTheScreen();
  expect(screen.getByRole('header', { name: 'Léa' })).toBeOnTheScreen();
  expect(screen.getByRole('header', { name: 'Hugo' })).toBeOnTheScreen();
  expect(
    screen.getByRole('checkbox', { name: 'Cahier de liaison' }),
  ).toBeChecked();
  expect(screen.getByText('coché par Julien')).toBeOnTheScreen();
  expect(screen.getByRole('checkbox', { name: 'Kimono' })).not.toBeChecked();
  expect(
    screen.getByText('Les deux parents voient et cochent la même liste.'),
  ).toBeOnTheScreen();
  expect(bagApi.get).toHaveBeenCalledWith(FAMILY_ID);

  await fireEvent.press(screen.getByRole('button', { name: 'Retour' }));
  expect(goBack).toHaveBeenCalled();
});

test('vide : la phrase et le champ d’ajout', async () => {
  bagApi.get.mockResolvedValue(EMPTY);
  await renderScreen();
  expect(
    await screen.findByText("La liste du sac est vide pour l'instant."),
  ).toBeOnTheScreen();
  expect(screen.getByText('Pour quel enfant ?')).toBeOnTheScreen();
  expect(screen.getByLabelText('Ajouter pour Léa')).toBeOnTheScreen();
  expect(screen.queryByText(/sur \d+ cochés/)).toBeNull();
});

test('erreur de chargement puis « Réessayer »', async () => {
  bagApi.get.mockRejectedValueOnce(new ApiError(500));
  await renderScreen();
  expect(
    await screen.findByText(
      'Impossible de charger le sac. Vérifiez votre connexion.',
    ),
  ).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Réessayer' }));
  expect(await screen.findByText('1 sur 3 cochés')).toBeOnTheScreen();
});

test('cocher puis décocher', async () => {
  bagApi.check.mockResolvedValue(KIMONO_CHECKED);
  bagApi.uncheck.mockResolvedValue(FILLED);
  await renderScreen();

  await fireEvent.press(
    await screen.findByRole('checkbox', { name: 'Kimono' }),
  );
  expect(bagApi.check).toHaveBeenCalledWith(FAMILY_ID, 'i2');
  expect(await screen.findByText('2 sur 3 cochés')).toBeOnTheScreen();
  expect(screen.getByRole('checkbox', { name: 'Kimono' })).toBeChecked();
  expect(screen.getByText('coché par Camille')).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('checkbox', { name: 'Kimono' }));
  expect(bagApi.uncheck).toHaveBeenCalledWith(FAMILY_ID, 'i2');
  expect(await screen.findByText('1 sur 3 cochés')).toBeOnTheScreen();
});

test('cocher sans passage prévu côté serveur : message', async () => {
  bagApi.check.mockRejectedValue(new ApiError(409));
  await renderScreen();
  await fireEvent.press(
    await screen.findByRole('checkbox', { name: 'Kimono' }),
  );
  expect(
    await screen.findByText("Aucun passage de garde n'est prévu."),
  ).toBeOnTheScreen();
});

test('sans passage prévu : cases désactivées et explication', async () => {
  bagApi.get.mockResolvedValue({ ...FILLED, handoverAt: null });
  await renderScreen();
  expect(
    await screen.findByText(
      "Aucun passage de garde n'est prévu : les éléments ne peuvent pas être cochés pour l'instant.",
    ),
  ).toBeOnTheScreen();
  expect(screen.getByRole('checkbox', { name: 'Kimono' })).toBeDisabled();
});

test('ajouter un élément pour l’enfant choisi', async () => {
  bagApi.addItem.mockResolvedValue(FILLED);
  bagApi.get.mockResolvedValue(EMPTY);
  await renderScreen();

  const lea = await screen.findByRole('radio', { name: 'Léa' });
  expect(lea).toBeChecked();
  await fireEvent.press(screen.getByRole('radio', { name: 'Hugo' }));
  expect(screen.getByRole('radio', { name: 'Hugo' })).toBeChecked();
  expect(screen.queryByLabelText('Ajouter pour Léa')).toBeNull();

  await fireEvent.changeText(
    screen.getByLabelText('Ajouter pour Hugo'),
    '  Kimono ',
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Ajouter' }));
  await waitFor(() =>
    expect(bagApi.addItem).toHaveBeenCalledWith(FAMILY_ID, {
      childId: 'c2',
      label: 'Kimono',
    }),
  );
  expect(await screen.findByText('1 sur 3 cochés')).toBeOnTheScreen();
  expect(screen.getByLabelText('Ajouter pour Hugo')).toHaveDisplayValue('');
});

test('ajout vide : message, rien n’est envoyé', async () => {
  await renderScreen();
  await fireEvent.press(await screen.findByRole('button', { name: 'Ajouter' }));
  expect(
    await screen.findByText("Saisissez l'élément à ajouter."),
  ).toBeOnTheScreen();
  expect(bagApi.addItem).not.toHaveBeenCalled();
});

test('appui long : confirmation, puis suppression', async () => {
  const alert = jest.spyOn(Alert, 'alert');
  bagApi.deleteItem.mockResolvedValue({
    ...FILLED,
    total: 2,
    children: [
      FILLED.children[0],
      { ...FILLED.children[1], items: [FILLED.children[1].items[1]] },
    ],
  });
  await renderScreen();

  await fireEvent(
    await screen.findByRole('checkbox', { name: 'Kimono' }),
    'longPress',
  );
  expect(alert.mock.calls[0][0]).toBe('Supprimer « Kimono » ?');
  const buttons = alert.mock.calls[0][2] ?? [];
  const remove = buttons.find(b => b.text === 'Supprimer');
  expect(remove?.style).toBe('destructive');
  await remove?.onPress?.();

  expect(bagApi.deleteItem).toHaveBeenCalledWith(FAMILY_ID, 'i2');
  expect(await screen.findByText('1 sur 2 cochés')).toBeOnTheScreen();
  expect(screen.queryByRole('checkbox', { name: 'Kimono' })).toBeNull();
  alert.mockRestore();
});

test('un seul enfant : pas de choix, le champ nomme l’enfant', async () => {
  bagApi.get.mockResolvedValue({ ...EMPTY, children: [EMPTY.children[0]] });
  await renderScreen();
  expect(await screen.findByLabelText('Ajouter pour Léa')).toBeOnTheScreen();
  expect(screen.queryByText('Pour quel enfant ?')).toBeNull();
  expect(screen.queryByRole('radio')).toBeNull();
});

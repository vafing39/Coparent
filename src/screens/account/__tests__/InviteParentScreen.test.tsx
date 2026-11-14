import React from 'react';
import Clipboard from '@react-native-clipboard/clipboard';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { InviteParentScreen } from '../InviteParentScreen';
import type { Family } from '../../../api/types';
import { FamilyProvider } from '../../../context/FamilyContext';
import { useSession } from '../../../stores/session';
import { authResponse } from '../../../test-utils/authFixtures';
import { familyApi } from '../../../test-utils/fakeApiClient';
import { family } from '../../../test-utils/familyFixtures';
import { renderWithProviders } from '../../../test-utils/render';

jest.mock('../../../api/client', () =>
  jest.requireActual('../../../test-utils/fakeApiClient'),
);

const SOLO_INVITED: Family = family({
  invitation: {
    inviteeFirstName: 'Julien',
    sentAt: '2026-11-01T10:00:00Z',
    expiresAt: '2026-11-08T10:00:00Z',
    expired: true,
  },
});

const goBack = jest.fn();
const props = {
  navigation: { goBack },
  route: { key: 'InviterParent', name: 'InviterParent' },
} as unknown as React.ComponentProps<typeof InviteParentScreen>;

async function renderScreen(value: Family) {
  familyApi.fetchMyFamily.mockResolvedValue(value);
  await renderWithProviders(
    <FamilyProvider>
      <InviteParentScreen {...props} />
    </FamilyProvider>,
  );
  await screen.findByRole('header', { name: "Inviter l'autre parent" });
}

beforeEach(async () => {
  goBack.mockReset();
  familyApi.fetchMyFamily.mockReset();
  familyApi.createInvitation.mockReset().mockResolvedValue({
    link: 'https://coparent.test/invitation?token=nouveau',
    expiresAt: '2026-11-20T10:00:00Z',
  });
  (Clipboard.setString as jest.Mock).mockClear();
  await useSession.getState().signIn(authResponse());
});

test('lien expiré : son état, le prénom repris, un nouveau lien copié', async () => {
  await renderScreen(SOLO_INVITED);
  expect(
    screen.getByText('Le lien envoyé à Julien le 1 novembre a expiré.'),
  ).toBeOnTheScreen();
  expect(
    screen.getByText(
      'Le lien est valable 7 jours. Un nouveau lien remplace le précédent, qui ne fonctionnera plus.',
    ),
  ).toBeOnTheScreen();
  expect(screen.getByLabelText("Prénom de l'autre parent")).toHaveDisplayValue(
    'Julien',
  );
  expect(screen.queryByText('Passer cette étape')).toBeNull();

  await fireEvent.press(screen.getByRole('button', { name: 'Copier le lien' }));
  await waitFor(() =>
    expect(Clipboard.setString).toHaveBeenCalledWith(
      'https://coparent.test/invitation?token=nouveau',
    ),
  );
  expect(familyApi.createInvitation).toHaveBeenCalledWith(
    SOLO_INVITED.id,
    'Julien',
  );
  // La famille est relue pour afficher le nouvel état de l'invitation
  await waitFor(() => expect(familyApi.fetchMyFamily).toHaveBeenCalledTimes(2));

  await fireEvent.press(screen.getByRole('button', { name: 'Terminé' }));
  expect(goBack).toHaveBeenCalled();
});

test('jamais invité : prénom à saisir, pas d’état', async () => {
  await renderScreen(family());
  expect(screen.queryByText(/Invitation envoyée|a expiré/)).toBeNull();
  expect(screen.getByLabelText("Prénom de l'autre parent")).toHaveDisplayValue(
    '',
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Copier le lien' }));
  expect(
    await screen.findByText("Indiquez le prénom de l'autre parent."),
  ).toBeOnTheScreen();
  expect(familyApi.createInvitation).not.toHaveBeenCalled();
});

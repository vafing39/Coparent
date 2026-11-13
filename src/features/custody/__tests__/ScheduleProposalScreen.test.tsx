import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { ScheduleProposalScreen } from '../ScheduleProposalScreen';
import { ApiError } from '../../../api/errors';
import type { CustodySchedule, Family } from '../../../api/types';
import { FamilyProvider } from '../../../context/FamilyContext';
import { ScheduleProposalProvider } from '../../../context/ScheduleProposalContext';
import { useSession } from '../../../stores/session';
import { authResponse } from '../../../test-utils/authFixtures';
import { familyApi, scheduleApi } from '../../../test-utils/fakeApiClient';
import { family } from '../../../test-utils/familyFixtures';
import { renderWithProviders } from '../../../test-utils/render';

jest.mock('../../../api/client', () =>
  jest.requireActual('../../../test-utils/fakeApiClient'),
);

/** Je suis Julien (B), qui vient de rejoindre ; Camille (A) a proposé le rythme. */
const JULIEN: Family = family({
  solo: false,
  myRole: 'PARENT_B',
  members: [
    { userId: 'u1', firstName: 'Camille', role: 'PARENT_A' },
    { userId: 'u2', firstName: 'Julien', role: 'PARENT_B' },
  ],
});

const FROM_CAMILLE: CustodySchedule = {
  id: 's1',
  pattern: 'ALTERNATE_WEEKS',
  customSequence: null,
  startDate: '2026-11-13', // un vendredi
  handoverTime: '17:50:00',
  startingParent: 'PARENT_A',
  holidayFirstHalfEvenYears: 'PARENT_A',
  summerSplit: 'FORTNIGHTS',
  status: 'PROPOSED',
  proposedById: 'u1',
  proposedByFirstName: 'Camille',
};

const goBack = jest.fn();

async function renderScreen() {
  const props = {
    navigation: { goBack, navigate: jest.fn() },
    route: {
      key: 'ScheduleProposal',
      name: 'ScheduleProposal',
      params: { scheduleId: 's1' },
    },
  } as unknown as React.ComponentProps<typeof ScheduleProposalScreen>;
  await renderWithProviders(
    <FamilyProvider>
      <ScheduleProposalProvider>
        <ScheduleProposalScreen {...props} />
      </ScheduleProposalProvider>
    </FamilyProvider>,
  );
}

beforeEach(async () => {
  goBack.mockReset();
  familyApi.fetchMyFamily.mockResolvedValue(JULIEN);
  familyApi.proposeSchedule.mockReset();
  scheduleApi.get.mockReset().mockResolvedValue(FROM_CAMILLE);
  scheduleApi.accept
    .mockReset()
    .mockResolvedValue({ ...FROM_CAMILLE, status: 'ACTIVE' });
  await useSession.getState().signIn(authResponse());
});

test('le rythme reçu, puis « Valider ce rythme »', async () => {
  await renderScreen();
  expect(
    await screen.findByText(
      "Camille propose ce rythme de garde. Il s'appliquera une fois que vous l'aurez validé.",
    ),
  ).toBeOnTheScreen();
  expect(scheduleApi.get).toHaveBeenCalledWith(JULIEN.id, 's1');
  expect(screen.getByText('Une semaine sur deux')).toBeOnTheScreen();
  expect(screen.getByText('Le vendredi à 17 h 50')).toBeOnTheScreen();
  expect(
    screen.getByText('Camille a la 1re moitié les années paires'),
  ).toBeOnTheScreen();
  expect(screen.getByText('Par quinzaines')).toBeOnTheScreen();

  await fireEvent.press(
    screen.getByRole('button', { name: 'Valider ce rythme' }),
  );
  expect(scheduleApi.accept).toHaveBeenCalledWith(JULIEN.id, 's1');
  await waitFor(() => expect(goBack).toHaveBeenCalled());
});

test('« Proposer une modification » : rythme puis vacances, pré-remplis', async () => {
  familyApi.proposeSchedule.mockImplementation(async (_id, body) => ({
    ...FROM_CAMILLE,
    ...body,
    customSequence: null,
    id: 's2',
    proposedById: 'u2',
    proposedByFirstName: 'Julien',
  }));
  await renderScreen();
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Proposer une modification' }),
  );
  expect(
    screen.getByRole('header', { name: 'Choisissez le rythme de garde' }),
  ).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('radio', { name: /^2-2-3/ }));
  await fireEvent.press(screen.getByRole('button', { name: 'Continuer' }));
  expect(
    screen.getByRole('header', { name: 'Vacances scolaires' }),
  ).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Enregistrer' }));

  await waitFor(() => expect(goBack).toHaveBeenCalled());
  expect(familyApi.proposeSchedule).toHaveBeenCalledWith(
    JULIEN.id,
    expect.objectContaining({
      pattern: 'TWO_TWO_THREE',
      handoverTime: '17:50',
      // Camille gardait les enfants après la bascule, et la 1re moitié les années paires.
      startingParent: 'PARENT_A',
      holidayFirstHalfEvenYears: 'PARENT_A',
      summerSplit: 'FORTNIGHTS',
    }),
  );
  expect(scheduleApi.accept).not.toHaveBeenCalled();
});

test('mon propre rythme : en attente de l’autre parent, sans bouton', async () => {
  scheduleApi.get.mockResolvedValue({
    ...FROM_CAMILLE,
    proposedById: 'u2',
    proposedByFirstName: 'Julien',
  });
  await renderScreen();
  expect(
    await screen.findByText('En attente de validation par Camille.'),
  ).toBeOnTheScreen();
  expect(
    screen.queryByRole('button', { name: 'Valider ce rythme' }),
  ).toBeNull();
});

test('refus du serveur affiché tel quel', async () => {
  scheduleApi.accept.mockRejectedValue(
    new ApiError(409, "Ce rythme n'attend plus de validation."),
  );
  await renderScreen();
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Valider ce rythme' }),
  );
  expect(
    await screen.findByText("Ce rythme n'attend plus de validation."),
  ).toBeOnTheScreen();
  expect(goBack).not.toHaveBeenCalled();
});

test('rythme introuvable : cause et « Réessayer »', async () => {
  scheduleApi.get.mockRejectedValue(new ApiError(404, 'Not found'));
  await renderScreen();
  expect(await screen.findByText("Ce rythme n'existe plus.")).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Réessayer' })).toBeOnTheScreen();
});

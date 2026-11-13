import React, { useCallback, useState } from 'react';
import type { Family } from '../api/types';
import { BagProvider } from '../context/BagContext';
import { CalendarProvider } from '../context/CalendarContext';
import { CustodyProvider } from '../context/CustodyContext';
import { EventsProvider } from '../context/EventsContext';
import { ExchangesProvider } from '../context/ExchangesContext';
import { FamilyProvider } from '../context/FamilyContext';
import { MessagesProvider } from '../context/MessagesContext';
import { ToDoProvider } from '../context/ToDoContext';
import { useFamily } from '../hooks/useFamily';
import { useInvitation } from '../hooks/useInvitation';
import { InvitationBlockedScreen } from '../screens/invitation/InvitationBlockedScreen';
import { InvitationConfirmScreen } from '../screens/invitation/InvitationConfirmScreen';
import { JoinFamilyScreen } from '../screens/invitation/JoinFamilyScreen';
import { AppNavigator } from './AppNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';

/** Famille prête : au moins un enfant et un rythme de garde enregistré. */
function isFamilySetUp(family: Family | null): boolean {
  return (
    family !== null &&
    family.children.length > 0 &&
    family.custodySchedule !== null
  );
}

/**
 * Espace connecté : la famille est chargée une fois (FamilyProvider), puis l'app ou la
 * première connexion. Le choix est fait à l'ouverture : pendant la première connexion,
 * le rythme est enregistré à l'étape 4, et c'est la fin de l'étape 5 qui ouvre l'app.
 */
export function SignedInNavigator({
  emailVerified,
}: {
  emailVerified: boolean;
}) {
  return (
    <FamilyProvider>
      <SignedInContent emailVerified={emailVerified} />
    </FamilyProvider>
  );
}

function SignedInContent({ emailVerified }: { emailVerified: boolean }) {
  const { family } = useFamily();
  const [onboardingDone, setOnboardingDone] = useState(() =>
    isFamilySetUp(family),
  );
  const finishOnboarding = useCallback(() => setOnboardingDone(true), []);
  const { pendingInvitation } = useInvitation();

  // Invitation reçue par lien, une fois l'email vérifié : rejoindre plutôt que créer une famille.
  if (pendingInvitation && emailVerified) {
    if (family !== null) {
      return <InvitationBlockedScreen />;
    }
    if (!pendingInvitation.confirmed) {
      return <InvitationConfirmScreen />;
    }
    return <JoinFamilyScreen onJoined={finishOnboarding} />;
  }

  if (onboardingDone) {
    return (
      <CustodyProvider>
        <CalendarProvider>
          <EventsProvider>
            <BagProvider>
              <ToDoProvider>
                <ExchangesProvider>
                  <MessagesProvider>
                    <AppNavigator />
                  </MessagesProvider>
                </ExchangesProvider>
              </ToDoProvider>
            </BagProvider>
          </EventsProvider>
        </CalendarProvider>
      </CustodyProvider>
    );
  }
  return (
    <OnboardingNavigator
      // La clé remonte le navigateur après la vérification, qui s'ouvre alors sur la famille.
      key={emailVerified ? 'famille' : 'verification'}
      emailVerified={emailVerified}
      onFinish={finishOnboarding}
    />
  );
}

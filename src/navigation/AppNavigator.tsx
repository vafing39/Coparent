import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EventDetailScreen } from '../features/events/EventDetailScreen';
import { EventFormScreen } from '../features/events/EventFormScreen';
import { ScheduleProposalScreen } from '../features/custody/ScheduleProposalScreen';
import { ExchangeDetailScreen } from '../features/exchanges/ExchangeDetailScreen';
import { ExchangeFormScreen } from '../features/exchanges/ExchangeFormScreen';
import { ATraiterScreen } from '../features/home/ATraiterScreen';
import { BalanceScreen } from '../features/expenses/BalanceScreen';
import { ContestExpenseScreen } from '../features/expenses/ContestExpenseScreen';
import { ExpenseFormScreen } from '../features/expenses/ExpenseFormScreen';
import { ReceiptScreen } from '../features/expenses/ReceiptScreen';
import { SacAPreparerScreen } from '../features/home/SacAPreparerScreen';
import { ConversationScreen } from '../features/messages/ConversationScreen';
import { NewConversationScreen } from '../features/messages/NewConversationScreen';
import { WelcomeScreen } from '../features/messages/WelcomeScreen';
import { CompteFamilleScreen } from '../screens/account/CompteFamilleScreen';
import { AppearanceScreen } from '../screens/account/AppearanceScreen';
import { CalendarColorsScreen } from '../screens/account/CalendarColorsScreen';
import { InviteParentScreen } from '../screens/account/InviteParentScreen';
import { ChangePasswordScreen } from '../screens/account/ChangePasswordScreen';
import { DataExportScreen } from '../screens/account/DataExportScreen';
import { DeleteAccountScreen } from '../screens/account/DeleteAccountScreen';
import { TabsNavigator } from './TabsNavigator';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

/** Espace connecté : les onglets, et par-dessus les écrans sans barre d'onglets (« À traiter », « Sac à préparer », événements, échanges, discussions, compte). */
export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onglets" component={TabsNavigator} />
      <Stack.Screen name="ATraiter" component={ATraiterScreen} />
      <Stack.Screen name="SacAPreparer" component={SacAPreparerScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen
        name="EventForm"
        component={EventFormScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="ExchangeDetail" component={ExchangeDetailScreen} />
      <Stack.Screen
        name="ExchangeForm"
        component={ExchangeFormScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="ScheduleProposal"
        component={ScheduleProposalScreen}
      />
      <Stack.Screen name="Conversation" component={ConversationScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="CompteFamille" component={CompteFamilleScreen} />
      <Stack.Screen name="InviterParent" component={InviteParentScreen} />
      <Stack.Screen name="Apparence" component={AppearanceScreen} />
      <Stack.Screen
        name="CouleursCalendrier"
        component={CalendarColorsScreen}
      />
      <Stack.Screen
        name="ModifierMotDePasse"
        component={ChangePasswordScreen}
      />
      <Stack.Screen name="MesDonnees" component={DataExportScreen} />
      <Stack.Screen name="SupprimerCompte" component={DeleteAccountScreen} />
      <Stack.Screen
        name="ExpenseForm"
        component={ExpenseFormScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="ContestExpense" component={ContestExpenseScreen} />
      <Stack.Screen name="Balance" component={BalanceScreen} />
      <Stack.Screen
        name="Receipt"
        component={ReceiptScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="NewConversation"
        component={NewConversationScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EventDetailScreen } from '../features/events/EventDetailScreen';
import { EventFormScreen } from '../features/events/EventFormScreen';
import { ATraiterScreen } from '../features/home/ATraiterScreen';
import { SacAPreparerScreen } from '../features/home/SacAPreparerScreen';
import { ConversationScreen } from '../features/messages/ConversationScreen';
import { NewConversationScreen } from '../features/messages/NewConversationScreen';
import { WelcomeScreen } from '../features/messages/WelcomeScreen';
import { TabsNavigator } from './TabsNavigator';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

/** Espace connecté : les onglets, et par-dessus les écrans sans barre d'onglets (« À traiter », « Sac à préparer », événements, discussions). */
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
      <Stack.Screen name="Conversation" component={ConversationScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen
        name="NewConversation"
        component={NewConversationScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}

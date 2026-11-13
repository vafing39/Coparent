import React from 'react';
import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import {
  CalendarIcon,
  EuroIcon,
  FamilyIcon,
  HomeIcon,
  MessageIcon,
} from '../components/icons';
import { AccueilScreen } from '../screens/tabs/AccueilScreen';
import { CalendrierScreen } from '../screens/tabs/CalendrierScreen';
import { DepensesScreen } from '../screens/tabs/DepensesScreen';
import { FamilleOngletScreen } from '../screens/tabs/FamilleOngletScreen';
import { MessagesScreen } from '../screens/tabs/MessagesScreen';
import { useFamily } from '../hooks/useFamily';
import { useTheme } from '../theme/ThemeProvider';
import type { TabsParamList } from './types';

const Tab = createBottomTabNavigator<TabsParamList>();

type IconComponent = typeof HomeIcon;
type TabRenderProps = { focused: boolean; color: string };

/** Icône d'onglet : sur l'onglet actif, une pastille primary-soft derrière l'icône (maquette). */
function tabIcon(Icon: IconComponent) {
  return ({ focused, color }: TabRenderProps) => (
    <View
      className={`h-[30px] w-12 items-center justify-center rounded-full ${
        focused ? 'bg-primary-soft' : ''
      }`}
    >
      <Icon color={color} />
    </View>
  );
}

/** Libellé d'onglet : agrandissement du texte plafonné à 1,4 (CLAUDE.md, accessibilité). */
function tabLabel(label: string) {
  return ({ focused, color }: TabRenderProps) => (
    <Text
      maxFontSizeMultiplier={1.4}
      numberOfLines={1}
      style={{ color }}
      className={`mt-[3px] text-[11px] ${
        focused ? 'font-extrabold' : 'font-semibold'
      }`}
    >
      {label}
    </Text>
  );
}

const homeIcon = tabIcon(HomeIcon);
const calendarIcon = tabIcon(CalendarIcon);
const messageIcon = tabIcon(MessageIcon);
const familyIcon = tabIcon(FamilyIcon);
const euroIcon = tabIcon(EuroIcon);

/** Espace connecté, une fois la première connexion terminée : les 5 onglets. */
export function TabsNavigator() {
  const { color } = useTheme();
  const { t } = useTranslation();
  const { family } = useFamily();

  const tab = (label: string, icon: ReturnType<typeof tabIcon>) => ({
    title: label,
    tabBarAccessibilityLabel: label,
    tabBarIcon: icon,
    tabBarLabel: tabLabel(label),
  });

  return (
    <Tab.Navigator
      // « Retour » (flèche de Messages, bouton Android) ramène à l'onglet précédent.
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color('primary'),
        tabBarInactiveTintColor: color('text-secondary'),
        tabBarStyle: {
          backgroundColor: color('card'),
          borderTopColor: color('border'),
          paddingTop: 8,
        },
        sceneStyle: { backgroundColor: color('background') },
      }}
    >
      <Tab.Screen
        name="Accueil"
        component={AccueilScreen}
        options={tab(t('tabs.accueil'), homeIcon)}
      />
      <Tab.Screen
        name="Calendrier"
        component={CalendrierScreen}
        options={tab(t('tabs.calendrier'), calendarIcon)}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          ...tab(t('tabs.messages'), messageIcon),
          // Conversation plein écran, sans barre d'onglets (écart voulu avec la maquette) ;
          // en solo, l'écran d'attente garde la barre.
          ...(family?.solo === false && { tabBarStyle: { display: 'none' } }),
        }}
      />
      <Tab.Screen
        name="Famille"
        component={FamilleOngletScreen}
        options={tab(t('tabs.famille'), familyIcon)}
      />
      <Tab.Screen
        name="Depenses"
        component={DepensesScreen}
        options={tab(t('tabs.depenses'), euroIcon)}
      />
    </Tab.Navigator>
  );
}

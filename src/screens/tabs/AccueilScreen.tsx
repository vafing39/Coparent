import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { FamilyRole } from '../../api/types';
import { CustodyCards } from '../../features/home/CustodyCards';
import { HomeHeader } from '../../features/home/HomeHeader';
import { SoloBanner } from '../../features/home/SoloBanner';
import { ToDoCard } from '../../features/home/ToDoCard';
import { TodayCard } from '../../features/home/TodayCard';
import { useFamily } from '../../hooks/useFamily';
import { openToDoItem } from '../../features/home/openToDoItem';
import type { TabScreenProps } from '../../navigation/types';

/**
 * Onglet Accueil : où dorment les enfants ce soir et le prochain passage, calculés par le
 * backend, les événements du jour et l'aperçu de « À traiter » (« Tout voir » ouvre son écran).
 */
export function AccueilScreen({ navigation }: TabScreenProps<'Accueil'>) {
  const { family } = useFamily();
  const now = new Date();

  if (!family) {
    // Les onglets ne s'ouvrent qu'une fois la famille créée (SignedInNavigator).
    return null;
  }
  const otherRole: FamilyRole =
    family.myRole === 'PARENT_A' ? 'PARENT_B' : 'PARENT_A';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView contentContainerClassName="gap-4 px-4 pt-5 pb-8">
        <HomeHeader
          now={now}
          onOpenAccount={() => navigation.navigate('CompteFamille')}
        />
        {family.solo ? <SoloBanner otherRole={otherRole} /> : null}
        <CustodyCards onOpenBag={() => navigation.navigate('SacAPreparer')} />
        <TodayCard
          onOpenEvent={event => navigation.navigate('EventDetail', { event })}
        />
        <ToDoCard
          onSeeAll={() => navigation.navigate('ATraiter')}
          onOpen={item => openToDoItem(navigation, item)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

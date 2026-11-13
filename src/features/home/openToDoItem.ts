import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ToDoItem } from '../../api/types';
import type { AppStackParamList } from '../../navigation/types';

/** Ouvre l'écran d'une demande « À traiter » (voir `canOpen`) ; sans écran, rien ne se passe. */
export function openToDoItem(
  navigation: Pick<NativeStackNavigationProp<AppStackParamList>, 'navigate'>,
  item: ToDoItem,
) {
  if (!item.targetId) {
    return;
  }
  if (item.kind === 'EXCHANGE') {
    navigation.navigate('ExchangeDetail', { exchangeId: item.targetId });
  } else if (item.kind === 'CUSTODY_SCHEDULE') {
    navigation.navigate('ScheduleProposal', { scheduleId: item.targetId });
  }
}

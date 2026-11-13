import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePreferences } from '../preferences';

beforeEach(async () => {
  await AsyncStorage.clear();
  usePreferences.setState({ appearance: 'system', swapParentColors: false });
});

test('par défaut : apparence du téléphone, couleurs non interverties', () => {
  expect(usePreferences.getState()).toMatchObject({
    appearance: 'system',
    swapParentColors: false,
  });
});

test('les choix sont enregistrés sur le téléphone', async () => {
  usePreferences.getState().setAppearance('dark');
  usePreferences.getState().toggleSwapParentColors();
  expect(usePreferences.getState()).toMatchObject({
    appearance: 'dark',
    swapParentColors: true,
  });
  const saved = JSON.parse(
    (await AsyncStorage.getItem('coparent-preferences')) ?? '{}',
  );
  expect(saved.state).toEqual({ appearance: 'dark', swapParentColors: true });
});

test('intervertir deux fois rend les couleurs d’origine', () => {
  usePreferences.getState().toggleSwapParentColors();
  usePreferences.getState().toggleSwapParentColors();
  expect(usePreferences.getState().swapParentColors).toBe(false);
});

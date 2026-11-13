import React from 'react';
import { Appearance, Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { usePreferences } from '../../stores/preferences';
import { ThemeProvider, useTheme } from '../ThemeProvider';
import { colors } from '../tokens';

function Probe() {
  const { scheme, color } = useTheme();
  return <Text>{`${scheme} ${color('parent-a')}`}</Text>;
}

beforeEach(() => {
  usePreferences.setState({ appearance: 'system', swapParentColors: false });
});

test('le choix des réglages prime sur le téléphone, et les couleurs s’intervertissent', async () => {
  const setColorScheme = jest.spyOn(Appearance, 'setColorScheme');
  await render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  );
  expect(
    screen.getByText(`light ${colors['parent-a'].light}`),
  ).toBeOnTheScreen();
  expect(setColorScheme).toHaveBeenLastCalledWith('unspecified');

  await act(() => {
    usePreferences.setState({ appearance: 'dark', swapParentColors: true });
  });
  expect(screen.getByText(`dark ${colors['parent-b'].dark}`)).toBeOnTheScreen();
  expect(setColorScheme).toHaveBeenLastCalledWith('dark');
  setColorScheme.mockRestore();
});

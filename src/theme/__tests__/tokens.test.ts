import { colorTokenNames, colorVariables, hexToRgbChannels } from '../tokens';

const tailwindConfig = require('../../../tailwind.config.js');

test('convertit un hex en canaux RVB', () => {
  expect(hexToRgbChannels('#3F6B5C')).toBe('63 107 92');
  expect(hexToRgbChannels('#FFFFFF')).toBe('255 255 255');
});

test('fournit une variable par jeton, en clair comme en sombre', () => {
  for (const scheme of ['light', 'dark'] as const) {
    const v = colorVariables(scheme);
    expect(Object.keys(v)).toHaveLength(colorTokenNames.length);
    expect(v['--color-primary']).toMatch(/^\d+ \d+ \d+$/);
  }
});

test('tailwind.config.js déclare exactement les jetons de tokens.ts', () => {
  const declared = Object.keys(tailwindConfig.theme.colors).filter(
    name => name !== 'transparent',
  );
  expect(declared.sort()).toEqual([...colorTokenNames].sort());
});

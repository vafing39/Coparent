import {
  color,
  colors,
  colorTokenNames,
  colorVariables,
  hexToRgbChannels,
  swappedToken,
} from '../tokens';

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

test('couleurs interverties : chaque parent prend la couleur de l’autre, le reste ne change pas', () => {
  expect(swappedToken('parent-a', true)).toBe('parent-b');
  expect(swappedToken('parent-b-soft', true)).toBe('parent-a-soft');
  expect(swappedToken('primary', true)).toBe('primary');
  expect(swappedToken('parent-a', false)).toBe('parent-a');
  expect(color('parent-a', 'dark', true)).toBe(colors['parent-b'].dark);
  const swapped = colorVariables('light', true);
  const normal = colorVariables('light');
  expect(swapped['--color-parent-a']).toBe(normal['--color-parent-b']);
  expect(swapped['--color-parent-b-soft']).toBe(
    normal['--color-parent-a-soft'],
  );
  expect(swapped['--color-primary']).toBe(normal['--color-primary']);
});

/**
 * Jetons du design system « Coparentalité ».
 * Source unique des valeurs : NativeWind les reçoit en variables CSS (ThemeProvider),
 * et les API qui n'acceptent pas de className (StatusBar, navigation) les lisent ici.
 */

export type ColorScheme = 'light' | 'dark';

export const colors = {
  primary: { light: '#3F6B5C', dark: '#7FB3A0' },
  'primary-soft': { light: '#E3EDE8', dark: '#23332D' },
  'on-primary': { light: '#FFFFFF', dark: '#141A17' },
  accent: { light: '#E8B923', dark: '#E0B32E' },
  'on-accent': { light: '#24302B', dark: '#141A17' },
  'parent-a': { light: '#3B7EA1', dark: '#6FA8CC' },
  'parent-a-soft': { light: '#DCEBF3', dark: '#1E3340' },
  'parent-b': { light: '#C8873A', dark: '#E0A85E' },
  'parent-b-soft': { light: '#F6E7D3', dark: '#3A2C1A' },
  background: { light: '#FAF8F4', dark: '#141A17' },
  surface: { light: '#FFFDF9', dark: '#1E2622' },
  border: { light: '#E4E0D8', dark: '#2F3833' },
  'text-secondary': { light: '#5E6A64', dark: '#A3ADA7' },
  text: { light: '#24302B', dark: '#ECEFEA' },
  shared: { light: '#8A7BB8', dark: '#A99BD6' },
  validated: { light: '#2F855A', dark: '#5FB58A' },
  pending: { light: '#64748B', dark: '#94A3B8' },
  error: { light: '#B4443C', dark: '#E07A70' },
  'avatar-rose': { light: '#F3E1E4', dark: '#3A2529' },
  'avatar-rose-ink': { light: '#7A3E4A', dark: '#F0C9D0' },
  'avatar-olive': { light: '#E8EBD9', dark: '#2C3120' },
  'avatar-olive-ink': { light: '#4E5A2A', dark: '#D3DBB0' },
  'avatar-prune': { light: '#EDE1EC', dark: '#33232F' },
  'avatar-prune-ink': { light: '#5E3A5B', dark: '#E3C6DF' },
  'avatar-warmgray': { light: '#ECEAE6', dark: '#2B2926' },
  'avatar-warmgray-ink': { light: '#4A4640', dark: '#DAD6CF' },
} as const;

export type ColorToken = keyof typeof colors;

export const colorTokenNames = Object.keys(colors) as ColorToken[];

/** Couleur résolue d'un jeton pour un thème (pour les API sans className). */
export function color(token: ColorToken, scheme: ColorScheme): string {
  return colors[token][scheme];
}

/** « #3F6B5C » → « 63 107 92 », format attendu par `rgb(var(--x) / <alpha-value>)`. */
export function hexToRgbChannels(hex: string): string {
  const h = hex.replace('#', '');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)).join(' ');
}

/** Variables CSS d'un thème : { '--color-primary': '63 107 92', … }. */
export function colorVariables(scheme: ColorScheme): Record<string, string> {
  return Object.fromEntries(
    colorTokenNames.map(name => [
      `--color-${name}`,
      hexToRgbChannels(colors[name][scheme]),
    ]),
  );
}

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 24,
  6: 32,
  8: 48,
} as const;

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  full: 999,
} as const;

export const size = {
  'tap-target': 48,
  'icon-sm': 16,
  'icon-md': 24,
  'avatar-sm': 32,
  'avatar-md': 40,
  'avatar-lg': 64,
} as const;

/** Noms de fichiers des polices (identiques au nom PostScript sur iOS). */
export const fonts = {
  regular: 'Nunito-Regular',
  semibold: 'Nunito-SemiBold',
  bold: 'Nunito-Bold',
  extrabold: 'Nunito-ExtraBold',
} as const;
